import { createInstance } from 'fhevmjs';
import { sepolia } from 'wagmi/chains';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI } from './contract';

let fhevmInstance: any = null;

/**
 * Initialize FHE instance for decryption
 */
export async function initFheInstance() {
  if (fhevmInstance) return fhevmInstance;

  try {
    fhevmInstance = await createInstance({
      chainId: sepolia.id,
      networkUrl: sepolia.rpcUrls.default.http[0],
      gatewayUrl: 'https://gateway.sepolia.zama.ai',
    });

    console.log('✅ FHE instance initialized');
    return fhevmInstance;
  } catch (error) {
    console.error('Failed to initialize FHE instance:', error);
    throw error;
  }
}

/**
 * Decrypt listing data (private key and seller wallet)
 * Uses Zama's free FHE Gateway on Sepolia testnet
 */
export async function decryptListingData(
  contractAddress: string,
  listingId: bigint,
  encryptedPrivateKey: readonly any[],
  encryptedWallet: readonly any[],
  walletClient: any
) {
  try {
    console.log('🔐 Initializing FHE decryption...');
    const instance = await initFheInstance();

    // Get provider and signer
    const provider = new BrowserProvider(walletClient);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();

    console.log('👤 User address:', userAddress);
    console.log('📝 Listing ID:', listingId.toString());

    // Generate EIP-712 signature for decryption permission
    const { publicKey, signature } = await instance.generateToken({
      verifyingContract: contractAddress,
    });

    instance.setSignature(contractAddress, signature);
    console.log('✅ Decryption signature generated');

    // Get contract instance
    const contract = new Contract(contractAddress, CONTRACT_ABI, signer);

    console.log('🔓 Decrypting wallet address (20 bytes)...');
    const walletBytes: number[] = [];
    for (let i = 0; i < 20; i++) {
      // Each encryptedWallet[i] is a euint8 ciphertext handle
      const ciphertext = encryptedWallet[i];
      const decrypted = await instance.reencrypt(
        ciphertext,
        contractAddress,
        publicKey,
        signature,
        signer
      );
      walletBytes.push(decrypted);
    }

    // Convert bytes to address
    const walletAddress = '0x' + walletBytes.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('✅ Wallet decrypted:', walletAddress);

    console.log('🔓 Decrypting private key (32 bytes)...');
    const keyBytes: number[] = [];
    for (let i = 0; i < 32; i++) {
      const ciphertext = encryptedPrivateKey[i];
      const decrypted = await instance.reencrypt(
        ciphertext,
        contractAddress,
        publicKey,
        signature,
        signer
      );
      keyBytes.push(decrypted);
    }

    // Convert bytes to private key
    const privateKey = '0x' + keyBytes.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('✅ Private key decrypted (length):', privateKey.length);

    return {
      privateKey,
      walletAddress,
      error: null,
    };
  } catch (error: any) {
    console.error('Decryption failed:', error);
    throw new Error(`Failed to decrypt: ${error.message}`);
  }
}
