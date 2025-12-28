import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/node';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { ethers } from 'ethers';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Simple JSON database
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { listings: [] });

// Initialize database
await db.read();
db.data ||= { listings: [] };

/**
 * 🔥 ENCRYPT LISTING - Complete flow
 * Encrypts: price (1 euint64) + wallet (20 euint8) + key (32 euint8) = 53 FHE values
 * Stores: public metadata in DB for browsing
 */
app.post('/api/encrypt-listing', async (req, res) => {
  try {
    const { 
      // Private (will be encrypted)
      price,           // In ETH (e.g., "0.5")
      sellerWallet,    // "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
      privateKey,      // "0x47e179ec197488593b187f80a00eb0da91f1b9d0..."
      
      // Public (saved to DB)
      nftProject,      // "Bored Ape Yacht Club"
      quantity,        // 1
      collateral,      // "0.01"
      mintDate,        // 0 or timestamp
      
      // Contract info
      contractAddress,
      userAddress 
    } = req.body;

    console.log('📝 Creating encrypted listing...');
    console.log('Public metadata:', { nftProject, quantity, price, collateral, mintDate });

    // Validate required fields
    if (!price || !sellerWallet || !privateKey || !contractAddress || !userAddress) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['price', 'sellerWallet', 'privateKey', 'contractAddress', 'userAddress']
      });
    }

    if (!nftProject || quantity === undefined) {
      return res.status(400).json({
        error: 'Missing public metadata',
        required: ['nftProject', 'quantity', 'collateral', 'mintDate']
      });
    }

    // Validate formats
    if (!sellerWallet.match(/^0x[0-9a-fA-F]{40}$/)) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }

    if (!privateKey.match(/^0x[0-9a-fA-F]{64}$/)) {
      return res.status(400).json({ error: 'Invalid private key format' });
    }

    // Create FHEVM instance
    const fhevmInstance = await createInstance({
      ...SepoliaConfig,
      network: process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
    });

    console.log('✅ FHEVM instance created');

    // Create encrypted input for ALL 53 values
    const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);

    // 1. Encrypt PRICE (euint64)
    const priceInGwei = Math.floor(parseFloat(price) * 1e9);
    console.log(`💰 Encrypting price: ${price} ETH = ${priceInGwei} Gwei`);
    input.add64(priceInGwei);

    // 2. Encrypt WALLET (20 euint8)
    console.log('🔧 Encrypting wallet (20 bytes)...');
    const walletBytes = Buffer.from(sellerWallet.slice(2), 'hex');
    
    if (walletBytes.length !== 20) {
      return res.status(400).json({ error: 'Wallet must be exactly 20 bytes' });
    }

    for (let i = 0; i < 20; i++) {
      input.add8(walletBytes[i]);
    }

    // 3. Encrypt PRIVATE KEY (32 euint8)
    console.log('🔑 Encrypting private key (32 bytes)...');
    const keyBytes = Buffer.from(privateKey.slice(2), 'hex');
    
    if (keyBytes.length !== 32) {
      return res.status(400).json({ error: 'Private key must be exactly 32 bytes' });
    }

    for (let i = 0; i < 32; i++) {
      input.add8(keyBytes[i]);
    }

    console.log('⚡ Encrypting all 53 values...');
    const encrypted = await input.encrypt();
    console.log('✅ Encryption complete!');

    // Extract handles
    const handles = encrypted.handles;
    const proof = encrypted.inputProof;

    const encryptedPriceHandle = handles[0];
    const encryptedWalletHandles = handles.slice(1, 21);
    const encryptedKeyHandles = handles.slice(21, 53);

    // Save public metadata to database
    const listingMetadata = {
      id: Date.now(),
      nftProject,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      priceInGwei,
      collateral: parseFloat(collateral || '0'),
      mintDate: parseInt(mintDate || '0'),
      seller: userAddress,
      createdAt: new Date().toISOString(),
      onChain: false,
      contractListingId: null,
      txHash: null
    };

    db.data.listings.push(listingMetadata);
    await db.write();

    console.log('✅ Saved to database:', listingMetadata);

    res.json({
      success: true,
      encrypted: {
        price: encryptedPriceHandle,
        wallet: encryptedWalletHandles,
        privateKey: encryptedKeyHandles,
        proof: proof
      },
      publicData: listingMetadata,
      stats: {
        totalEncryptedValues: 53,
        priceValues: 1,
        walletValues: 20,
        keyValues: 32,
        estimatedGas: '~9,000,000 gas'
      }
    });

  } catch (error) {
    console.error('❌ Encryption error:', error);
    res.status(500).json({ 
      error: 'Encryption failed', 
      message: error.message 
    });
  }
});

/**
 * 📋 GET ALL LISTINGS
 * Returns public metadata for browse page
 */
app.get('/api/listings', async (req, res) => {
  try {
    await db.read();
    res.json({
      success: true,
      listings: db.data.listings
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch listings',
      message: error.message
    });
  }
});

/**
 * 🔍 GET SINGLE LISTING
 */
app.get('/api/listings/:id', async (req, res) => {
  try {
    await db.read();
    const listing = db.data.listings.find(
      l => l.contractListingId === parseInt(req.params.id) || l.id === parseInt(req.params.id)
    );

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch listing',
      message: error.message
    });
  }
});

/**
 * 📝 LINK LISTING TO CONTRACT
 * Called after on-chain creation to link DB record with contract
 */
app.post('/api/listings/:tempId/link', async (req, res) => {
  try {
    const { tempId } = req.params;
    const { listingId, txHash } = req.body;

    // Validate required fields
    if (!listingId || !txHash) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['listingId', 'txHash']
      });
    }

    await db.read();

    const listing = db.data.listings.find(l => l.id === parseInt(tempId));
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    console.log('🔗 Linking listing:');
    console.log('  tempId:', tempId);
    console.log('  contractListingId:', listingId);
    console.log('  txHash:', txHash);

    // Use the actual listing ID from the contract event
    listing.contractListingId = parseInt(listingId);
    listing.txHash = txHash;
    listing.onChain = true;

    await db.write();

    console.log('✅ Listing linked successfully!');

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('❌ Error linking listing:', error);
    res.status(500).json({
      error: 'Failed to link listing',
      message: error.message
    });
  }
});

/**
 * 🔓 DECRYPT LISTING DATA
 * Decrypts private key and wallet for buyers who purchased the listing
 */
app.post('/api/listings/:id/decrypt', async (req, res) => {
  try {
    const listingId = parseInt(req.params.id);
    const {
      buyerAddress,
      encryptedWallet,
      encryptedPrivateKey,
      publicKey,
      privateKey: fhePrivateKey,
      signature,
      startTimestamp,
      durationDays,
      contractAddress
    } = req.body;

    if (!buyerAddress || !encryptedWallet || !encryptedPrivateKey || !publicKey || !fhePrivateKey || !signature) {
      return res.status(400).json({ error: 'Missing required fields for user decryption' });
    }

    console.log(`🔓 User-authorized decryption for listing ${listingId} from ${buyerAddress}`);
    console.log('   Encrypted wallet handles:', encryptedWallet.length);
    console.log('   Encrypted key handles:', encryptedPrivateKey.length);

    // Get listing from database
    await db.read();
    const listing = db.data.listings.find(
      l => l.contractListingId === listingId
    );

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found in database' });
    }

    // Create contract instance to verify buyer
    const CONTRACT_ADDRESS = contractAddress || process.env.CONTRACT_ADDRESS || '0x679D729C04E1Ae78b6BFDe2Ed5097CED197bbCb8';
    const provider = new ethers.JsonRpcProvider(
      process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
    );

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      [
        'function getListing(uint256) view returns (tuple(uint256 listingId, address seller, bytes32[20] encryptedSellerWallet, address buyer, string nftProject, uint256 quantity, bytes32 encryptedPrice, uint256 collateral, uint256 buyerPayment, bytes32[32] encryptedPrivateKey, bytes32 privateKeyHash, uint256 mintDate, uint256 confirmationDeadline, uint8 status, uint256 createdAt, uint256 soldAt, uint256 completedAt, bool hasCollateral, bool mintDateSet, bool underManualReview, string reviewNotes))'
      ],
      provider
    );

    console.log('📡 Verifying buyer on-chain...');

    // Verify caller is the actual buyer
    const onChainListing = await contract.getListing(listingId);
    const actualBuyer = onChainListing.buyer.toLowerCase();

    if (actualBuyer !== buyerAddress.toLowerCase()) {
      console.log(`❌ Unauthorized: Expected ${actualBuyer}, got ${buyerAddress}`);
      return res.status(403).json({
        error: 'Unauthorized: You are not the buyer of this listing'
      });
    }

    if (actualBuyer === '0x0000000000000000000000000000000000000000') {
      return res.status(400).json({
        error: 'Listing not yet purchased'
      });
    }

    console.log('✅ Buyer verified:', actualBuyer);

    // Create FHEVM instance for user decryption
    console.log('🔐 Creating FHEVM instance for user decryption...');
    const fhevmInstance = await createInstance({
      ...SepoliaConfig,
      network: process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
    });

    console.log('✅ FHEVM instance created');

    // Prepare handles with contract addresses for userDecrypt
    console.log('🔓 Decrypting with user signature...');
    const handlePairs = [
      ...encryptedWallet.map((handle: string) => ({ handle, contractAddress: CONTRACT_ADDRESS })),
      ...encryptedPrivateKey.map((handle: string) => ({ handle, contractAddress: CONTRACT_ADDRESS }))
    ];

    // Use userDecrypt with the signature
    const decryptionResult = await fhevmInstance.userDecrypt(
      handlePairs,
      fhePrivateKey,
      publicKey,
      signature,
      [CONTRACT_ADDRESS],
      buyerAddress,
      startTimestamp || Math.floor(Date.now() / 1000),
      durationDays || 1
    );

    console.log('✅ Decryption completed');

    // Extract decrypted values from result
    // userDecrypt returns Record<handle, value>
    const walletBytes: number[] = [];
    for (let i = 0; i < 20; i++) {
      const handle = encryptedWallet[i];
      const value = decryptionResult[handle];
      walletBytes.push(Number(value));
    }
    const walletAddress = '0x' + walletBytes.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('✅ Wallet decrypted:', walletAddress);

    const keyBytes: number[] = [];
    for (let i = 0; i < 32; i++) {
      const handle = encryptedPrivateKey[i];
      const value = decryptionResult[handle];
      keyBytes.push(Number(value));
    }
    const privateKeyHex = '0x' + keyBytes.map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('✅ Private key decrypted (length):', privateKeyHex.length);

    res.json({
      success: true,
      walletAddress,
      privateKey: privateKeyHex,
      listingId
    });

  } catch (error: any) {
    console.error('❌ Decryption error:', error);
    res.status(500).json({
      error: 'Decryption failed',
      message: error.message
    });
  }
});

/**
 * ❤️ HEALTH CHECK
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'FHE Marketplace Backend',
    features: {
      encryption: '53 FHE values (price + wallet + key)',
      storage: 'Public metadata in DB',
      api: 'Browse listings endpoint'
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log('\n🚀 FHE MARKETPLACE BACKEND');
  console.log('='.repeat(50));
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('\n📊 Endpoints:');
  console.log('   POST /api/encrypt-listing - Encrypt + save metadata');
  console.log('   GET  /api/listings - Get all public listings');
  console.log('   GET  /api/listings/:id - Get single listing');
  console.log('   POST /api/listings/:id/link - Link temp to contract ID');
  console.log('   POST /api/listings/:id/decrypt - Decrypt data for buyer');
  console.log('   GET  /api/health - Health check');
  console.log('\n🔐 Encryption:');
  console.log('   - 1 euint64 (price)');
  console.log('   - 20 euint8 (wallet)');
  console.log('   - 32 euint8 (private key)');
  console.log('   = 53 FHE values total!');
  console.log('\n💾 Storage:');
  console.log('   - Public metadata in db.json');
  console.log('   - Frontend can browse listings');
  console.log('='.repeat(50));
});
