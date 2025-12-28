import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI } from './contract';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Decrypt listing data via backend API
 * Frontend fetches encrypted data (proving buyer ownership),
 * then backend decrypts using @zama-fhe/relayer-sdk
 */
export async function decryptListingData(
  contractAddress: string,
  listingId: bigint,
  encryptedPrivateKey: readonly any[],
  encryptedWallet: readonly any[],
  walletClient: any
) {
  try {
    console.log('🔐 Requesting decryption from backend...');

    // Get buyer address
    const provider = new BrowserProvider(walletClient);
    const signer = await provider.getSigner();
    const buyerAddress = await signer.getAddress();

    console.log('👤 Buyer address:', buyerAddress);
    console.log('📝 Listing ID:', listingId.toString());

    // Get contract instance with signer (to prove buyer ownership)
    const contract = new Contract(contractAddress, CONTRACT_ABI, signer);

    // Fetch encrypted data from contract (this call is authorized because signer is buyer)
    console.log('📥 Fetching encrypted data from contract as buyer...');
    const [walletHandles, keyHandles] = await contract.getEncryptedData(listingId);

    console.log('✅ Got encrypted data from contract');
    console.log('   Wallet handles:', walletHandles.length);
    console.log('   Key handles:', keyHandles.length);

    // Send encrypted handles to backend for decryption
    const response = await fetch(`${BACKEND_URL}/api/listings/${listingId}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerAddress,
        encryptedWallet: walletHandles,
        encryptedPrivateKey: keyHandles
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Decryption failed');
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
