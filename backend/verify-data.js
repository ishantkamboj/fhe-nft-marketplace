/**
 * Data Verification Script
 * Compares backend data structure with contract expectations
 */

console.log('📊 Backend Data Structure (stored in db.json):');
console.log(`
{
  id: <timestamp>,              // Temporary backend ID
  nftProject: string,            // Public - NFT project name
  quantity: number,              // Public - number of WL spots
  price: number,                 // Public - price in ETH
  priceInGwei: number,          // Public - price in Gwei (for contract)
  collateral: number,            // Public - collateral amount in ETH
  mintDate: number,              // Public - mint date timestamp (0 if TBD)
  seller: string,                // Public - seller's address (from wallet)
  createdAt: string,             // Public - ISO timestamp
  onChain: boolean,              // Initially false, true after linking
  contractListingId: number,     // null initially, set after linking
  txHash: string                 // null initially, set after linking
}
`);

console.log('🔗 Contract Data Structure (from EncryptedWLMarketplace.sol):');
console.log(`
struct Listing {
  uint256 listingId;              // Auto-incremented by contract
  address payable seller;         // msg.sender who created
  euint8[20] encryptedSellerWallet; // ENCRYPTED - seller's receiving wallet
  address payable buyer;          // Zero initially, set on purchase
  string nftProject;              // PUBLIC - from backend
  uint256 quantity;               // PUBLIC - from backend
  uint256 price;                  // PUBLIC - priceInGwei from backend
  uint256 collateral;             // PUBLIC - from backend (in wei)
  uint256 buyerPayment;           // Set when purchased
  euint8[32] encryptedPrivateKey; // ENCRYPTED - WL private key
  bytes32 privateKeyHash;         // Hash of encryption proof
  uint256 mintDate;               // PUBLIC - from backend
  uint256 confirmationDeadline;   // Set when sold
  ListingStatus status;           // Active initially
  uint256 createdAt;              // block.timestamp
  uint256 soldAt;                 // 0 initially
  uint256 completedAt;            // 0 initially
  bool hasCollateral;             // true if collateral > 0
  bool mintDateSet;               // true if mintDate > 0
  bool decryptionEnabled;         // false initially
  bool underManualReview;         // false initially
  string reviewNotes;             // empty initially
}
`);

console.log('✅ Data Flow:');
console.log(`
1. Frontend → Backend: Sends raw data (price, wallet, private key, metadata)
2. Backend:
   - Encrypts sensitive data (wallet, private key) using Zama SDK
   - Stores PUBLIC metadata in db.json
   - Returns encrypted handles + proof
3. Frontend → Contract: Creates listing with encrypted handles
4. Contract:
   - Stores encrypted data on-chain
   - Emits ListingCreated event with listingId
5. Frontend → Backend: Links backend record to contract listingId
6. Backend: Updates db.json with contractListingId and txHash

IMPORTANT FIELDS ALIGNMENT:
- Backend 'price' (ETH) → Contract 'price' (must be in Gwei)
- Backend 'priceInGwei' → Contract 'price' ✅
- Backend 'seller' → Contract 'seller' ✅
- Backend 'nftProject' → Contract 'nftProject' ✅
- Backend 'quantity' → Contract 'quantity' ✅
- Backend 'collateral' (ETH) → Contract 'collateral' (must be in Wei) ✅
- Backend 'mintDate' → Contract 'mintDate' ✅
`);

console.log('⚠️  ENCRYPTED DATA (NOT in db.json):');
console.log(`
The following are ONLY stored on-chain in encrypted form:
1. Seller's receiving wallet address (20 euint8 values)
2. WL private key (32 euint8 values)

Backend does NOT store these - they are only:
- Encrypted by backend
- Returned to frontend as handles
- Stored on-chain by contract
- Decryptable only by authorized buyer
`);

console.log('\n🔍 To verify your data, check:');
console.log('1. Backend: cat backend/db.json');
console.log('2. Contract: Call getListing(listingId) on contract');
console.log('3. Match: backend.contractListingId === contract.listingId');
console.log('4. Match: backend.price === contract.price / 1e9 (convert Gwei to ETH)');
