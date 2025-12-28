import { BrowserProvider, Contract } from 'ethers';
import { createInstance, SepoliaConfig } from 'fhevmjs/web';
import { CONTRACT_ABI } from './contract';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Decrypt listing data using user signature
 * 1. Generate FHE keypair for decryption
 * 2. Create EIP712 permission structure
 * 3. User signs permission
 * 4. Backend uses signature to decrypt via KMS Gateway
 */
export async function decryptListingData(
  contractAddress: string,
  listingId: bigint,
  encryptedPrivateKey: readonly any[],
  encryptedWallet: readonly any[],
  walletClient: any
) {
  try {
    console.log('🔐 Starting user-authorized decryption...');

    // Get buyer address
    const provider = new BrowserProvider(walletClient);
    const signer = await provider.getSigner();
    const buyerAddress = await signer.getAddress();

    console.log('👤 Buyer address:', buyerAddress);
    console.log('📝 Listing ID:', listingId.toString());

    // Fetch encrypted data from contract (authorized as buyer)
    const contract = new Contract(contractAddress, CONTRACT_ABI, signer);
    console.log('📥 Fetching encrypted data from contract...');
    const [walletHandles, keyHandles] = await contract.getEncryptedData(listingId);

    console.log('✅ Got encrypted handles');
    console.log('   Wallet handles:', walletHandles.length);
    console.log('   Key handles:', keyHandles.length);

    // Create FHE instance to generate keypair and EIP712
    console.log('🔑 Creating FHE instance for signature...');
    const fhevmInstance = await createInstance({
      chainId: SepoliaConfig.chainId,
      networkUrl: 'https://devnet.zama.ai',
      gatewayUrl: 'https://gateway.devnet.zama.ai',
    });

    // Generate keypair for decryption
    const { publicKey, privateKey } = fhevmInstance.generateKeypair();
    console.log('✅ Keypair generated');

    // Create EIP712 structure for decryption permission
    const startTimestamp = Math.floor(Date.now() / 1000);
    const durationDays = 1; // Permission valid for 1 day

    const eip712 = fhevmInstance.createEIP712(
      publicKey,
      contractAddress,
      startTimestamp,
      durationDays
    );

    console.log('📝 Requesting signature for decryption permission...');

    // Ask user to sign the EIP712 message
    const signature = await signer.signTypedData(
      eip712.domain,
      eip712.types,
      eip712.message
    );

    console.log('✅ Signature obtained');

    // Send to backend for decryption
    console.log('📤 Sending to backend for decryption...');
    const response = await fetch(`${BACKEND_URL}/api/listings/${listingId}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerAddress,
        encryptedWallet: walletHandles,
        encryptedPrivateKey: keyHandles,
        publicKey,
        privateKey,
        signature,
        startTimestamp,
        durationDays,
        contractAddress
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Decryption failed');
    }

    const data = await response.json();

    console.log('✅ Decryption successful!');
    console.log('   Wallet:', data.walletAddress);
    console.log('   Private key length:', data.privateKey.length);

    return {
      privateKey: data.privateKey,
      walletAddress: data.walletAddress,
      error: null,
    };
  } catch (error: any) {
    console.error('Decryption failed:', error);
    throw new Error(`Failed to decrypt: ${error.message}`);
  }
}
