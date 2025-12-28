import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ABI } from './contract';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Decrypt listing data using user signature
 * Two-step process:
 * 1. Get signature params from backend (generates keypair & EIP712)
 * 2. User signs, send back to backend for decryption
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
    const result = await contract.getEncryptedData(listingId);

    // WORKAROUND: Deployed contract returns (price, wallet, key) instead of (wallet, key)
    // Skip the first element (price) and use the rest
    const walletHandles = result[1]; // Skip result[0] which is the price
    const keyHandles = result[2];

    console.log('✅ Got encrypted handles');
    console.log('   Wallet handles:', walletHandles.length);
    console.log('   Key handles:', keyHandles.length);

    // Step 1: Request signature parameters from backend
    console.log('🔑 Requesting signature parameters from backend...');
    const prepareResponse = await fetch(`${BACKEND_URL}/api/listings/${listingId}/prepare-decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerAddress,
        encryptedWallet: walletHandles,
        encryptedPrivateKey: keyHandles,
        contractAddress
      }),
    });

    if (!prepareResponse.ok) {
      const error = await prepareResponse.json();
      throw new Error(error.message || error.error || 'Failed to prepare decryption');
    }

    const { eip712, publicKey, privateKey: fhePrivateKey, startTimestamp, durationDays } = await prepareResponse.json();

    console.log('✅ Got signature parameters');
    console.log('📝 Requesting user signature...');

    // Step 2: Ask user to sign the EIP712 message
    // Remove EIP712Domain from types (ethers handles it automatically via domain param)
    const { EIP712Domain, ...typesWithoutDomain } = eip712.types;

    const signature = await signer.signTypedData(
      eip712.domain,
      typesWithoutDomain,
      eip712.message
    );

    console.log('✅ Signature obtained');

    // Step 3: Send signature back to backend for decryption
    console.log('📤 Sending signature to backend for decryption...');
    const decryptResponse = await fetch(`${BACKEND_URL}/api/listings/${listingId}/decrypt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerAddress,
        encryptedWallet: walletHandles,
        encryptedPrivateKey: keyHandles,
        publicKey,
        privateKey: fhePrivateKey,
        signature,
        startTimestamp,
        durationDays,
        contractAddress
      }),
    });

    if (!decryptResponse.ok) {
      const error = await decryptResponse.json();
      throw new Error(error.message || error.error || 'Decryption failed');
    }

    const data = await decryptResponse.json();

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

