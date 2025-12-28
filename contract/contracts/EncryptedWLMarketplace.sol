// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EncryptedWLMarketplace - PRODUCTION VERSION (Stack Optimized)
 * @notice NFT Whitelist marketplace with FHE encryption and async decryption
 * 
 * FEATURES:
 * ✅ Public price (browseable UX)
 * ✅ FHE encrypted wallet (20 euint8)
 * ✅ FHE encrypted private key (32 euint8)
 * ✅ Async decryption support
 * ✅ Total: 52 FHE encrypted values per listing
 */
contract EncryptedWLMarketplace is ZamaEthereumConfig, Ownable, ReentrancyGuard {
    
    enum ListingStatus {
        Active,
        Sold,
        Completed,
        UnderReview,
        Disputed,
        Cancelled
    }

    struct Listing {
        uint256 listingId;
        address payable seller;
        euint8[20] encryptedSellerWallet;
        address payable buyer;
        string nftProject;
        uint256 quantity;
        uint256 price;                        // PUBLIC (in gwei)
        uint256 collateral;
        uint256 buyerPayment;
        euint8[32] encryptedPrivateKey;
        bytes32 privateKeyHash;
        uint256 mintDate;
        uint256 confirmationDeadline;
        ListingStatus status;
        uint256 createdAt;
        uint256 soldAt;
        uint256 completedAt;
        bool hasCollateral;
        bool mintDateSet;
        bool decryptionEnabled;
        bool underManualReview;
        string reviewNotes;
    }

    // State
    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;
    mapping(address => uint256[]) public sellerListings;
    mapping(address => uint256[]) public buyerPurchases;
    
    // Constants
    uint256 public constant MIN_CONFIRMATION_TIME = 12 hours;
    uint256 public constant MAX_CONFIRMATION_TIME = 30 days;
    uint256 public constant MAX_MINT_DELAY = 365 days;
    uint256 public platformFeePercent = 2; // 2%
    
    // Events
    event ListingCreated(uint256 indexed listingId, string nftProject, uint256 quantity, uint256 collateral);
    event ListingSold(uint256 indexed listingId, address indexed buyer, uint256 payment);
    event DecryptionEnabled(uint256 indexed listingId);
    event MintConfirmed(uint256 indexed listingId, bool success);
    event ListingCompleted(uint256 indexed listingId, uint256 sellerPayout);
    event DisputeRaised(uint256 indexed listingId, string reason);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Create listing with FHE encryption
     */
    function createListing(
        string calldata nftProject,
        uint256 quantity,
        uint256 priceInGwei,
        externalEuint8[20] calldata encryptedWalletHandles,
        externalEuint8[32] calldata encryptedKeyHandles,
        bytes calldata inputProof,
        uint256 collateral,
        uint256 mintDate
    ) external payable nonReentrant returns (uint256) {
        require(bytes(nftProject).length > 0, "Project name required");
        require(quantity > 0, "Quantity must be > 0");
        require(priceInGwei > 0, "Price must be > 0");
        require(msg.value == collateral, "Collateral mismatch");
        
        if (mintDate > 0) {
            require(mintDate > block.timestamp, "Mint date in past");
            require(mintDate <= block.timestamp + MAX_MINT_DELAY, "Mint date too far");
        }

        listingCount++;
        uint256 listingId = listingCount;

        // Convert wallet bytes
        euint8[20] memory walletBytes;
        for (uint i = 0; i < 20; i++) {
            walletBytes[i] = FHE.fromExternal(encryptedWalletHandles[i], inputProof);
        }

        // Convert key bytes
        euint8[32] memory keyBytes;
        for (uint i = 0; i < 32; i++) {
            keyBytes[i] = FHE.fromExternal(encryptedKeyHandles[i], inputProof);
        }

        Listing storage listing = listings[listingId];
        listing.listingId = listingId;
        listing.seller = payable(msg.sender);
        listing.encryptedSellerWallet = walletBytes;
        listing.nftProject = nftProject;
        listing.quantity = quantity;
        listing.price = priceInGwei;
        listing.collateral = collateral;
        listing.encryptedPrivateKey = keyBytes;
        listing.privateKeyHash = keccak256(inputProof);
        listing.mintDate = mintDate;
        listing.status = ListingStatus.Active;
        listing.createdAt = block.timestamp;
        listing.hasCollateral = collateral > 0;
        listing.mintDateSet = mintDate > 0;

        sellerListings[msg.sender].push(listingId);

        // Set permissions
        for (uint i = 0; i < 20; i++) {
            FHE.allowThis(walletBytes[i]);
            FHE.allow(walletBytes[i], msg.sender);
        }

        for (uint i = 0; i < 32; i++) {
            FHE.allowThis(keyBytes[i]);
            FHE.allow(keyBytes[i], msg.sender);
        }

        emit ListingCreated(listingId, nftProject, quantity, collateral);
        return listingId;
    }

    /**
     * @notice Buy a listing
     */
    function buyListing(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(listing.status == ListingStatus.Active, "Not active");
        require(msg.sender != listing.seller, "Cannot buy own");
        require(msg.value > 0, "Payment required");

        listing.buyer = payable(msg.sender);
        listing.buyerPayment = msg.value;
        listing.soldAt = block.timestamp;
        listing.status = ListingStatus.Sold;

        buyerPurchases[msg.sender].push(listingId);

        // Grant buyer access
        for (uint i = 0; i < 20; i++) {
            FHE.allow(listing.encryptedSellerWallet[i], msg.sender);
        }

        for (uint i = 0; i < 32; i++) {
            FHE.allow(listing.encryptedPrivateKey[i], msg.sender);
        }

        emit ListingSold(listingId, msg.sender, msg.value);
    }

    /**
     * @notice Enable decryption (Step 1)
     */
    function enableDecryption(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(msg.sender == listing.buyer, "Only buyer");
        require(listing.status == ListingStatus.Sold, "Not sold");
        require(!listing.decryptionEnabled, "Already enabled");

        // Make decryptable
        for (uint i = 0; i < 20; i++) {
            FHE.makePubliclyDecryptable(listing.encryptedSellerWallet[i]);
        }

        for (uint i = 0; i < 32; i++) {
            FHE.makePubliclyDecryptable(listing.encryptedPrivateKey[i]);
        }

        listing.decryptionEnabled = true;
        emit DecryptionEnabled(listingId);
    }

    /**
     * @notice Finalize decryption (Step 2) - OPTIMIZED
     */
    function finalizeDecryption(
        uint256 listingId,
        uint8[20] calldata walletBytes,
        uint8[32] calldata keyBytes,
        bytes calldata decryptionProof
    ) external nonReentrant returns (address, bytes32) {
        Listing storage listing = listings[listingId];
        
        require(msg.sender == listing.buyer, "Only buyer");
        require(listing.decryptionEnabled, "Not enabled");

        // Verify proof
        _verifyDecryptionProof(listing, walletBytes, keyBytes, decryptionProof);

        // Convert to address and bytes32
        return (_bytesToAddress(walletBytes), _bytesToBytes32(keyBytes));
    }

    /**
     * @notice Internal: Verify decryption proof
     */
    function _verifyDecryptionProof(
        Listing storage listing,
        uint8[20] calldata walletBytes,
        uint8[32] calldata keyBytes,
        bytes calldata proof
    ) internal {
        bytes32[] memory cts = new bytes32[](52);
        
        for (uint i = 0; i < 20; i++) {
            cts[i] = FHE.toBytes32(listing.encryptedSellerWallet[i]);
        }
        
        for (uint i = 0; i < 32; i++) {
            cts[20 + i] = FHE.toBytes32(listing.encryptedPrivateKey[i]);
        }

        FHE.checkSignatures(cts, abi.encode(walletBytes, keyBytes), proof);
    }

    /**
     * @notice Internal: Convert uint8[20] to address
     */
    function _bytesToAddress(uint8[20] calldata b) internal pure returns (address) {
        bytes20 b20;
        assembly ("memory-safe") {
            calldatacopy(0, b, 20)
            b20 := mload(0)
        }
        return address(b20);
    }

    /**
     * @notice Internal: Convert uint8[32] to bytes32
     */
    function _bytesToBytes32(uint8[32] calldata b) internal pure returns (bytes32) {
        bytes32 b32;
        assembly ("memory-safe") {
            calldatacopy(0, b, 32)
            b32 := mload(0)
        }
        return b32;
    }

    /**
     * @notice Confirm mint
     */
    function confirmMint(uint256 listingId, bool success) external nonReentrant {
        Listing storage listing = listings[listingId];
        
        require(msg.sender == listing.buyer, "Only buyer");
        require(listing.status == ListingStatus.Sold, "Not sold");

        if (success) {
            listing.status = ListingStatus.Completed;
            listing.completedAt = block.timestamp;

            uint256 platformFee = (listing.buyerPayment * platformFeePercent) / 100;
            uint256 sellerPayout = listing.buyerPayment - platformFee + listing.collateral;

            (bool sent, ) = listing.seller.call{value: sellerPayout}("");
            require(sent, "Transfer failed");

            emit MintConfirmed(listingId, true);
            emit ListingCompleted(listingId, sellerPayout);
        } else {
            listing.status = ListingStatus.UnderReview;
            emit MintConfirmed(listingId, false);
        }
    }

    /**
     * @notice Raise dispute
     */
    function raiseDispute(uint256 listingId, string calldata reason) external {
        Listing storage listing = listings[listingId];
        
        require(msg.sender == listing.buyer || msg.sender == listing.seller, "Not authorized");
        require(listing.status == ListingStatus.Sold, "Not sold");

        listing.status = ListingStatus.Disputed;
        listing.underManualReview = true;
        listing.reviewNotes = reason;

        emit DisputeRaised(listingId, reason);
    }

    /**
     * @notice Get encrypted data
     */
    function getEncryptedData(uint256 listingId) 
        external 
        view 
        returns (euint8[20] memory, euint8[32] memory) 
    {
        Listing storage listing = listings[listingId];
        require(
            msg.sender == listing.buyer || msg.sender == listing.seller,
            "Not authorized"
        );
        
        return (listing.encryptedSellerWallet, listing.encryptedPrivateKey);
    }

    // VIEW FUNCTIONS
    
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    function getActiveListings() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].status == ListingStatus.Active) {
                activeCount++;
            }
        }

        uint256[] memory active = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= listingCount; i++) {
            if (listings[i].status == ListingStatus.Active) {
                active[index] = i;
                index++;
            }
        }

        return active;
    }

    function getSellerListings(address seller) external view returns (uint256[] memory) {
        return sellerListings[seller];
    }

    function getBuyerPurchases(address buyer) external view returns (uint256[] memory) {
        return buyerPurchases[buyer];
    }

    // ADMIN
    
    function setPlatformFee(uint256 newFeePercent) external onlyOwner {
        require(newFeePercent <= 10, "Max 10%");
        platformFeePercent = newFeePercent;
    }

    function withdrawFees() external onlyOwner {
        (bool sent, ) = owner().call{value: address(this).balance}("");
        require(sent, "Withdrawal failed");
    }

    receive() external payable {}
}
