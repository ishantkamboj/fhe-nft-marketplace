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

    // Get contract instance
    const contract = new Contract(contractAddress, CONTRACT_ABI, signer);

    // Get encrypted data from contract
    console.log('📥 Fetching encrypted data from contract...');
    const [priceBytes, walletBytes, keyBytes] = await contract.getEncryptedData(listingId);

    console.log('Encrypted wallet bytes length:', walletBytes.length);
    console.log('Encrypted key bytes length:', keyBytes.length);

    // Generate EIP-712 signature for decryption permission
    const { publicKey, signature } = await instance.generateToken({
      verifyingContract: contractAddress,
    });

    console.log('✅ Decryption signature generated');

    // Decrypt wallet address
    console.log('🔓 Decrypting wallet address...');
    const decryptedWallet = await instance.decrypt(
      contractAddress,
      walletBytes
    );
    const walletAddress = '0x' + Buffer.from(decryptedWallet).toString('hex');
    console.log('✅ Wallet decrypted:', walletAddress);

    // Decrypt private key
    console.log('🔓 Decrypting private key...');
    const decryptedKey = await instance.decrypt(
      contractAddress,
      keyBytes
    );
    const privateKey = '0x' + Buffer.from(decryptedKey).toString('hex');
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
