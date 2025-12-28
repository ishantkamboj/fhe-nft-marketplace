import { BrowserProvider } from 'ethers';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Decrypt listing data via backend API
 * Backend handles FHE decryption using @zama-fhe/relayer-sdk
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

    // Call backend decryption API
    const response = await fetch(`${BACKEND_URL}/api/listings/${listingId}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerAddress
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
