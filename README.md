# 🔐 FHE NFT Marketplace

> Private NFT whitelist trading using Zama's Fully Homomorphic Encryption

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue)](https://soliditylang.org/)
[![Zama](https://img.shields.io/badge/Zama-FHE-purple)](https://www.zama.ai/)
[![Network](https://img.shields.io/badge/Network-Sepolia-yellow)](https://sepolia.etherscan.io/)

## 🎯 Overview

A decentralized marketplace for trading NFT whitelist spots with **complete privacy**. Sellers list WL spots with encrypted private keys, buyers purchase securely - all sensitive data remains encrypted on-chain using Zama's FHE technology.

## 🔥 Key Innovation

**53 Encrypted Values Per Listing:**
- 1 euint64: Price (encrypted)
- 20 euint8: Wallet address (encrypted)
- 32 euint8: Private key (encrypted)

**Result:** Zero plaintext sensitive data on blockchain!

## 📋 Features

### ✅ Completed

- **Smart Contract (Solidity)**
  - 53 FHE encrypted values per listing
  - Collateral system for seller trust
  - Automated escrow payments
  - Buyer-only decryption permissions
  - Deployed on Sepolia: `0x679D729C04E1Ae78b6BFDe2Ed5097CED197bbCb8`

- **Backend Encryption Service (Node.js)**
  - Encrypts 53 values in ~2-5 seconds
  - Uses @zama-fhe/relayer-sdk
  - RESTful API for frontend
  - Public metadata storage
  
### 🚧 In Progress

- Frontend UI completion
- Listing browse interface
- Purchase flow
- Decryption interface

**Note:** Due to time constraints, frontend was not fully completed. Core FHE functionality and smart contract are production-ready.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  (React + Vite + Wagmi + RainbowKit)            │
│         [In Progress]                            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│              Backend API                         │
│     (Node.js + Express + Zama SDK)              │
│                                                  │
│  • Encrypts 53 FHE values                       │
│  • Stores public metadata                       │
│  • Provides listing data                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│           Smart Contract (Sepolia)               │
│                                                  │
│  struct Listing {                                │
│    euint64 encryptedPrice;        // 1 value    │
│    euint8[20] encryptedWallet;    // 20 values  │
│    euint8[32] encryptedKey;       // 32 values  │
│    bytes inputProof;              // Single proof│
│    ...                                           │
│  }                                               │
└──────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

```bash
node >= 18.0.0
npm >= 9.0.0
```

### 1. Clone Repository

```bash
git clone https://github.com/ishantkamboj/fhe-nft-marketplace
cd fhe-nft-marketplace
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Add your RPC URL to .env
npm run dev
```

### 3. Contract Deployment (Already Deployed)

Contract is live on Sepolia:
```
Address: 0x679D729C04E1Ae78b6BFDe2Ed5097CED197bbCb8
Network: Sepolia Testnet
```

View on [Etherscan](https://sepolia.etherscan.io/address/0x679D729C04E1Ae78b6BFDe2Ed5097CED197bbCb8)

## 📊 Technical Details

### Encryption Process

```javascript
// Backend encrypts 53 values
const instance = await createInstance({...SepoliaConfig});
const input = instance.createEncryptedInput(contractAddress, userAddress);

// 1. Price (euint64)
input.add64(priceInGwei);

// 2. Wallet (20 x euint8)
for (let i = 0; i < 20; i++) {
  input.add8(walletBytes[i]);
}

// 3. Private Key (32 x euint8)
for (let i = 0; i < 32; i++) {
  input.add8(keyBytes[i]);
}

const encrypted = await input.encrypt();
// Returns: handles + proof for all 53 values
```

### Smart Contract Functions

```solidity
// Create listing with encrypted data
function createListing(
    string memory nftProject,
    uint256 quantity,
    bytes32 encryptedPriceHandle,
    bytes32[20] memory encryptedWalletHandles,
    bytes32[32] memory encryptedKeyHandles,
    bytes memory inputProof,
    uint256 collateral,
    uint256 mintDate
) public payable returns (uint256)

// Buy listing
function buyListing(uint256 listingId) public payable

// Decrypt (buyer only)
function getEncryptedData(uint256 listingId) 
    public view returns (
        bytes memory price,
        bytes memory wallet,
        bytes memory privateKey
    )
```

## 🔐 Security Features

1. **FHE Encryption:** All sensitive data encrypted before touching blockchain
2. **Buyer-Only Decryption:** Only buyer can decrypt private key after purchase
3. **Collateral System:** Sellers lock funds to build trust
4. **Escrow:** Automated payment holding
5. **No Plaintext:** Zero sensitive data visible on-chain

## 🛠️ Tech Stack

**Smart Contract:**
- Solidity 0.8.24
- Zama TFHE library
- Hardhat deployment

**Backend:**
- Node.js 18+
- Express.js
- @zama-fhe/relayer-sdk v0.3.0-5
- LowDB for metadata

**Frontend (In Progress):**
- React 18
- Vite
- Wagmi v2
- RainbowKit
- fhevmjs v0.5.2

## 📁 Project Structure

```
fhe-nft-marketplace/
├── contract/
│   ├── contracts/
│   │   └── Marketplace.sol       # Main contract with 53 FHE values
│   ├── scripts/
│   │   └── deploy.js
│   └── hardhat.config.ts
│
├── backend/
│   ├── server.ts                 # Encryption API
│   ├── package.json
│   └── .env.example
│
├── frontend/                     # [In Progress]
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── README.md
└── .gitignore
```

## 🔗 Links

- **Contract:** [0x679D...bCb8](https://sepolia.etherscan.io/address/0x679D729C04E1Ae78b6BFDe2Ed5097CED197bbCb8)
- **Zama Docs:** [docs.zama.ai](https://docs.zama.ai/)
- **Network:** Sepolia Testnet

## 🚧 Known Limitations

- Frontend UI incomplete (time constraint)
- Decryption interface not implemented
- Browse page in progress

## 🔮 Future Enhancements

- [ ] Complete frontend integration
- [ ] Multi-chain deployment (Base, Polygon)
- [ ] Reputation system
- [ ] Bulk listing creation
- [ ] Mobile app
- [ ] Dispute resolution mechanism

## 🤝 Contributing

This was built for a hackathon. Contributions welcome!

## 📄 License

MIT

## 👤 Author

Built with ❤️ using Zama FHE

