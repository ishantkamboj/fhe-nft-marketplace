# 🔐 WL Marketplace - Private NFT Whitelist Trading Platform

> Secure peer-to-peer NFT whitelist trading powered by Fully Homomorphic Encryption (FHE)

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![Zama](https://img.shields.io/badge/Zama-FHE-purple)](https://www.zama.ai/)
[![Network](https://img.shields.io/badge/Network-Sepolia-yellow)](https://sepolia.etherscan.io/)

## 📖 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Key Features](#-key-features)
- [How It Works](#-how-it-works)
- [Technical Architecture](#-technical-architecture)
- [Smart Contract](#-smart-contract)
- [Security Features](#-security-features)
- [Getting Started](#-getting-started)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## Overview

**WL Marketplace** is a decentralized Over-The-Counter (OTC) marketplace that enables secure peer-to-peer trading of NFT whitelist spots. Using Zama's Fully Homomorphic Encryption (FHE) technology, sellers can list their whitelist private keys with complete privacy, while buyers can purchase them securely without risk of scams.

### The Problem We Solve

Traditional NFT whitelist trading faces several critical issues:
- **Scam Risk**: Sellers can use sniper bots to steal NFTs after selling the private key
- **Privacy Concerns**: Private keys exposed during the trading process
- **Trust Issues**: No escrow or protection mechanism for buyers
- **No Recourse**: Buyers have no way to dispute fraudulent listings

### Our Solution

WL Marketplace provides:
-  **FHE Encryption**: Private keys remain encrypted on-chain until purchase
-  **Collateral System**: Sellers lock security deposits to discourage scams
-  **Escrow Payments**: Automated fund holding and release
-  **Dispute Resolution**: Admin-mediated conflict resolution
-  **Buyer Protection**: Collateral compensation for scammed buyers

---

##  Live Demo

** Frontend Application**: [YOUR_FRONTEND_URL_HERE]

** Smart Contract (Sepolia)**: [`0xC90de47a46a1aF7eCa0d1eF12272d448382f46c1`](https://sepolia.etherscan.io/address/0xC90de47a46a1aF7eCa0d1eF12272d448382f46c1)

** Network**: Ethereum Sepolia Testnet

---

##  Key Features

### For Sellers
-  **List Whitelist Spots**: Encrypt and list private keys on-chain
-  **Set Your Price**: Price listings in ETH (stored in Gwei)
-  **Collateral Security**: Lock security deposits (recommended: equal to mint price)
-  **Flexible Mint Dates**: Update mint dates up to 5 times
-  **Cancel Anytime**: Cancel listings before sale with full collateral refund
-  **Automated Payments**: Receive 98% of sale price (2% platform fee)

### For Buyers
-  **Instant Purchase**: Buy whitelist spots with immediate access
-  **Secure Decryption**: Decrypt private keys using wallet signature
-  **12-Hour Confirmation**: Confirm within 12 hours after mint to release funds
-  **Scam Protection**: Receive seller's collateral if scammed
-  **Dispute Resolution**: Admin mediation for conflicts
-  **Full Transparency**: Track listing status on-chain

### Platform Features
-  **52 FHE Encrypted Values**: Wallet (20) + Private Key (32) fully encrypted
-  **Comprehensive FAQ**: Detailed help documentation
-  **Search & Filter**: Find specific NFT projects easily

---

## How It Works

### 1️⃣ Listing Creation (Seller)
```
Seller → Creates listing with:
  ├─ NFT Project name
  ├─ Whitelist wallet address (encrypted via FHE)
  ├─ Private key (encrypted via FHE)
  ├─ Price in ETH
  ├─ Collateral (security deposit)
  └─ Optional mint date

Backend → Encrypts 52 values using Zama SDK
Contract → Stores encrypted data on-chain
```

### 2️⃣ Purchase (Buyer)
```
Buyer → Pays listing price
Contract → Transfers payment to escrow
         └─ Enables decryption for buyer
Buyer → Decrypts private key using signature
      └─ Gets wallet address + private key
```

### 3️⃣ Minting
```
Buyer → Imports private key to wallet
      → Funds wallet with ETH for gas + mint
      → Mints NFT on mint date
      → Returns to platform
```

### 4️⃣ Confirmation
```
Success Path:
  Buyer → Clicks "Mint Successful"
  Contract → Releases payment to seller (98%)
          └─ Returns collateral to seller

Dispute Path:
  Buyer → Clicks "Mint Failed"
  Contract → Sets status to "Under Review"
  Admin → Investigates dispute
        → Favors buyer: Refund + collateral
        → Favors seller: Release payment + collateral
```

---

##  Technical Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)                │
│  ┌────────────┬────────────┬────────────┬──────────┐     │
│  │  HomePage  │   Create   │  Listings  │   FAQ    │     │
│  │            │   Listing  │  Details   │          │     │
│  └────────────┴────────────┴────────────┴──────────┘     │
│         │              │              │                  │
│         └──────────────┴──────────────┴──> Wagmi v2      │
│                                             RainbowKit   │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ HTTP REST API
                       │
┌──────────────────────▼───────────────────────────────────┐
│              Backend API (Node.js + Express)             │
│  ┌─────────────────────────────────────────────────┐     │
│  │  • POST /api/encrypt-listing                    │     │
│  │  • GET  /api/listings                           │     │
│  │  • POST /api/sync-listings                      │     │
│  │  • POST /api/listings/:id/prepare-decrypt       │     │
│  │  • POST /api/listings/:id/decrypt               │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  🔐 Zama FHE SDK (Encryption/Decryption)                 │
│  💾 LowDB (Public metadata cache)                       │
└──────────────────────┬───────────────────────────────────┘
                       │
                       │ Web3 RPC
                       │
┌──────────────────────▼───────────────────────────────────┐
│         Smart Contract (Solidity 0.8.24 + TFHE)          │
│                                                          │
│  struct Listing {                                        │
│    uint256 listingId;                                    │
│    address seller;                                       │
│    euint8[20] encryptedSellerWallet;  // 20 FHE values   │
│    euint8[32] encryptedPrivateKey;    // 32 FHE values   │
│    address buyer;                                        │
│    uint256 price;              // Gwei (public)          │
│    uint256 collateral;         // Wei (public)           │
│    uint256 mintDate;                                     │
│    ListingStatus status;                                 │
│    ...                                                   │
│  }                                                       │
│                                                          │
│   Deployed: 0xC90de47a46a1aF7eCa0d1eF12272d448382f46c1 │
└───────────────────────────────────────────────────────────┘
```

---

##  Smart Contract

### Deployment Details

**Contract Address**: `0xC90de47a46a1aF7eCa0d1eF12272d448382f46c1`
**Network**: Ethereum Sepolia Testnet
**Compiler**: Solidity 0.8.24 (1000 runs optimization)
**Verification**: [View on Etherscan](https://sepolia.etherscan.io/address/0xC90de47a46a1aF7eCa0d1eF12272d448382f46c1)

### Key Functions

```solidity
// Create a new listing
function createListing(
    string memory nftProject,
    uint256 quantity,
    uint256 price,              // In Gwei
    bytes32[20] memory encryptedWalletHandles,
    bytes32[32] memory encryptedKeyHandles,
    bytes memory inputProof,
    uint256 mintDate
) public payable returns (uint256)

// Purchase a listing
function buyListing(uint256 listingId) public payable

// Enable decryption (internal, called after purchase)
function enableDecryption(uint256 listingId) internal

// Confirm mint success/failure
function confirmMint(uint256 listingId, bool success) external

// Update mint date (seller only, max 5 times)
function updateMintDate(uint256 listingId, uint256 newMintDate) external

// Cancel listing (seller only, before sale)
function cancelListing(uint256 listingId) external

// Resolve dispute (admin only)
function resolveDispute(uint256 listingId, bool favorBuyer) external onlyOwner
```

### Listing Statuses

| Status | Code | Description |
|--------|------|-------------|
| Active | 0 | Available for purchase |
| Sold | 1 | Purchased, awaiting confirmation |
| Completed | 2 | Successfully completed |
| UnderReview | 3 | Dispute filed, under investigation |
| Disputed | 4 | Formal dispute opened |
| Cancelled | 5 | Cancelled by seller or admin |

### Events

```solidity
event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 price);
event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 price);
event DecryptionEnabled(uint256 indexed listingId);
event MintConfirmed(uint256 indexed listingId, bool success);
event ListingCompleted(uint256 indexed listingId, uint256 sellerPayout);
event MintDateUpdated(uint256 indexed listingId, uint256 newMintDate, uint256 updateCount);
event DisputeResolved(uint256 indexed listingId, bool favorBuyer, uint256 buyerRefund, uint256 sellerPayout);
event ListingCancelled(uint256 indexed listingId, uint256 collateralReturned);
```

---

## 🔐 Security Features

### 1. Fully Homomorphic Encryption (FHE)

- **What**: Zama's TFHE library encrypts sensitive data
- **Why**: Private keys remain encrypted on-chain
- **How**: Only the buyer can decrypt using their wallet signature

```javascript
// Encryption (Backend)
const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);

// Wallet: 20 bytes → 20 euint8 values
for (let i = 0; i < 20; i++) {
  input.add8(walletBytes[i]);
}

// Private Key: 32 bytes → 32 euint8 values
for (let i = 0; i < 32; i++) {
  input.add8(keyBytes[i]);
}

const encrypted = await input.encrypt();
// Returns: 52 FHE handles + proof
```

### 2. Collateral System

- **Seller Stakes**: Security deposit locked at listing creation
- **Recommended Amount**: Equal to NFT mint price
- **Protection**: If seller scams, buyer receives collateral + refund
- **Returned When**: Buyer confirms successful mint OR seller wins dispute

### 3. Escrow Mechanism

- **Payment Holding**: Buyer's payment held in contract
- **Release Conditions**:
  -  Buyer confirms "Mint Successful" → Seller gets 98%, collateral returned
  -  Buyer confirms "Mint Failed" → Goes to admin review
  -  12 hours pass without confirmation → Admin review

### 4. Dispute Resolution

- **Trigger**: Buyer clicks "Mint Failed"
- **Process**: Admin investigates both parties
- **Outcomes**:
  - Favor Buyer: Full refund + seller's collateral
  - Favor Seller: Payment + collateral to seller

### 5. Access Controls

- **OnlyOwner**: Dispute resolution (deployer wallet)
- **OnlySeller**: Cancel listing, update mint date
- **OnlyBuyer**: Decrypt data, confirm mint
- **ReentrancyGuard**: Prevents reentrancy attacks

---

##  Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/))

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/ishantkamboj/fhe-nft-marketplace.git
cd fhe-nft-marketplace
```

#### 2. Backend Setup

```bash
cd backend
npm install

# Create environment file
cp .env.example .env

# Configure .env
# RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
# CONTRACT_ADDRESS=0xC90de47a46a1aF7eCa0d1eF12272d448382f46c1
# PORT=3001

# Start backend
npm run dev
```

Backend will run on `http://localhost:3001`

#### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Create environment file
cp .env.example .env

# Configure .env
# VITE_BACKEND_URL=http://localhost:3001

# Start frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

#### 4. Smart Contract

The contract is already deployed on Sepolia. If you need to deploy your own:

```bash
cd ../contract
npm install

# Configure hardhat.config.ts with your private key
npx hardhat run scripts/deploy.ts --network sepolia
```

### Usage

1. **Connect Wallet**: Click "Connect Wallet" in the navbar
2. **Create Listing**: Navigate to "Create Listing" and fill in details
3. **Browse Listings**: View active listings on the homepage
4. **Purchase**: Click on a listing → "Buy Listing"
5. **Decrypt**: After purchase, click "Decrypt & View Private Key"
6. **Mint**: Import key to wallet, mint on mint date
7. **Confirm**: Return to platform and click "Mint Successful"

---

## 🛠️ Tech Stack

### Smart Contract
- **Language**: Solidity 0.8.24
- **Libraries**:
  - Zama TFHE (Fully Homomorphic Encryption)
  - OpenZeppelin (ReentrancyGuard, Ownable)
- **Tools**: Hardhat, Ethers.js
- **Network**: Ethereum Sepolia Testnet

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **FHE SDK**: @zama-fhe/relayer-sdk v0.3.0-5
- **Database**: LowDB (JSON file storage)
- **APIs**: RESTful endpoints

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Web3**:
  - Wagmi v2 (React hooks for Ethereum)
  - RainbowKit (Wallet connection UI)
  - fhevmjs v0.5.2 (FHE operations)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS

---

## 📁 Project Structure

```
fhe-nft-marketplace/
│
├── contract/                      # Smart contract code
│   ├── contracts/
│   │   └── EncryptedWLMarketplace.sol   # Main marketplace contract
│   ├── scripts/
│   │   └── deploy.ts              # Deployment script
│   ├── deployments/
│   │   └── sepolia-marketplace.json     # Deployment record
│   ├── hardhat.config.ts
│   └── package.json
│
├── backend/                       # Backend API server
│   ├── server.ts                  # Main Express server
│   │                              # Endpoints:
│   │                              #  - POST /api/encrypt-listing
│   │                              #  - GET  /api/listings
│   │                              #  - POST /api/sync-listings
│   │                              #  - POST /api/listings/:id/prepare-decrypt
│   │                              #  - POST /api/listings/:id/decrypt
│   ├── db.json                    # LowDB database
│   ├── package.json
│   └── .env.example
│
├── frontend/                      # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx       # Listing browse + stats
│   │   │   ├── CreateListingPage.tsx  # Create new listing
│   │   │   ├── ListingDetailPage.tsx  # View/buy/decrypt listing
│   │   │   ├── MyListingsPage.tsx     # Seller's listings
│   │   │   ├── MyPurchasesPage.tsx    # Buyer's purchases
│   │   │   └── FAQPage.tsx        # Help documentation
│   │   ├── components/
│   │   │   ├── Navbar.tsx         # Navigation bar
│   │   │   └── ListingCard.tsx    # Listing display card
│   │   ├── lib/
│   │   │   ├── contract.ts        # Contract ABI + address
│   │   │   └── wagmi.ts           # Wagmi configuration
│   │   └── App.tsx                # Main app component
│   ├── package.json
│   └── .env.example
│
├── README.md                      # This file
├── .gitignore
└── LICENSE
```
---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update README if adding new features
- Test thoroughly before submitting PR

---

## 🙏 Acknowledgments

- **Zama**: For the groundbreaking FHE technology and SDK
- **Ethereum**: For the robust blockchain infrastructure
- **OpenZeppelin**: For secure smart contract libraries
- **RainbowKit & Wagmi**: For excellent Web3 developer tools

---

## ⚠️ Disclaimer

This is experimental software deployed on testnet. Do not use with real funds or sensitive private keys on mainnet without thorough security audits. The developers are not responsible for any loss of funds or data.

---

**Built with ❤️ using Zama FHE Technology**

*Making NFT whitelist trading secure, private, and trustless.*
