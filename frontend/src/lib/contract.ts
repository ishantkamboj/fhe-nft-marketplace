export const CONTRACT_ADDRESS = "0x756cB08969c95D9c9178047304A4b1E316E4c8d7";

export const CONTRACT_ABI = [
  {
    "type": "function",
    "name": "createListing",
    "inputs": [
      { "name": "nftProject", "type": "string" },
      { "name": "quantity", "type": "uint256" },
      { "name": "priceInGwei", "type": "uint256" },
      { "name": "encryptedWalletHandles", "type": "bytes32[20]" },
      { "name": "encryptedKeyHandles", "type": "bytes32[32]" },
      { "name": "inputProof", "type": "bytes" },
      { "name": "collateral", "type": "uint256" },
      { "name": "mintDate", "type": "uint256" }
    ],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "buyListing",
    "inputs": [{ "name": "listingId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getActiveListings",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getListing",
    "inputs": [{ "name": "listingId", "type": "uint256" }],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "listingId", "type": "uint256" },
          { "name": "seller", "type": "address" },
          { "name": "encryptedSellerWallet", "type": "bytes32[20]" },
          { "name": "buyer", "type": "address" },
          { "name": "nftProject", "type": "string" },
          { "name": "quantity", "type": "uint256" },
          { "name": "price", "type": "uint256" },
          { "name": "collateral", "type": "uint256" },
          { "name": "buyerPayment", "type": "uint256" },
          { "name": "encryptedPrivateKey", "type": "bytes32[32]" },
          { "name": "privateKeyHash", "type": "bytes32" },
          { "name": "mintDate", "type": "uint256" },
          { "name": "confirmationDeadline", "type": "uint256" },
          { "name": "status", "type": "uint8" },
          { "name": "createdAt", "type": "uint256" },
          { "name": "soldAt", "type": "uint256" },
          { "name": "completedAt", "type": "uint256" },
          { "name": "hasCollateral", "type": "bool" },
          { "name": "mintDateSet", "type": "bool" },
          { "name": "decryptionEnabled", "type": "bool" },
          { "name": "underManualReview", "type": "bool" },
          { "name": "reviewNotes", "type": "string" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getSellerListings",
    "inputs": [{ "name": "seller", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getBuyerPurchases",
    "inputs": [{ "name": "buyer", "type": "address" }],
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "confirmMint",
    "inputs": [
      { "name": "listingId", "type": "uint256" },
      { "name": "success", "type": "bool" },
      { "name": "notes", "type": "string" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getEncryptedData",
    "inputs": [{ "name": "listingId", "type": "uint256" }],
    "outputs": [
      { "name": "wallet", "type": "bytes32[20]" },
      { "name": "privateKey", "type": "bytes32[32]" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "listingCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  }
] as const;

export const LISTING_STATUS = {
  0: "Active",
  1: "Sold",
  2: "Completed",
  3: "UnderReview",
  4: "Disputed",
  5: "Cancelled"
} as const;
