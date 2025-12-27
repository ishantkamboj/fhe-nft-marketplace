import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI, LISTING_STATUS } from '@/lib/contract';
import { formatEther, parseEther } from 'ethers';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = BigInt(params.id as string);
  const { address, isConnected } = useAccount();
  
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [backendListing, setBackendListing] = useState<any>(null);

  const { data: listing, refetch } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getListing',
    args: [listingId],
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Fetch backend data for price
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/listings`);
        if (response.ok) {
          const data = await response.json();
          const found = data.listings.find(
            (l: any) => l.contractListingId === Number(listingId)
          );
          if (found) {
            console.log('📊 Found backend listing:', found);
            setBackendListing(found);
          } else {
            console.log('⚠️ No backend listing found for ID:', listingId);
          }
        }
      } catch (error) {
        console.error('Failed to fetch backend data:', error);
      }
    };
    
    fetchBackendData();
  }, [listingId]);

  if (!listing) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-xl">Loading listing...</p>
      </div>
    );
  }

  const [
    id,
    seller,
    encryptedSellerWallet,
    buyer,
    nftProject,
    quantity,
    encryptedPrice,
    collateral,
    buyerPayment,
    encryptedPrivateKey,
    privateKeyHash,
    mintDate,
    confirmationDeadline,
    status,
    createdAt,
    soldAt,
    completedAt,
    hasCollateral,
    mintDateSet,
    underManualReview,
    reviewNotes
  ] = listing as any;

  const isBuyer = buyer === address;
  const isSeller = seller === address;
  const canBuy = status === 0 && !isSeller && isConnected;

  const formatMintDate = (timestamp: bigint | number) => {
    if (!timestamp || timestamp === 0n || timestamp === 0) return 'TBD';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const handleBuy = async () => {
    if (!canBuy || !backendListing?.price) {
      alert('Price not available. Please refresh the page.');
      return;
    }

    console.log('💰 Buying listing for:', backendListing.price, 'ETH');
    
    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'buyListing',
      args: [listingId],
      value: parseEther(backendListing.price.toString()),
    });
  };

  const handleGetPrivateKey = async () => {
    setShowPrivateKey(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{nftProject}</h1>
            <p className="text-gray-400">Listing #{listingId.toString()}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Status</div>
            <div className="text-lg font-semibold text-white">
              {LISTING_STATUS[status as keyof typeof LISTING_STATUS]}
            </div>
          </div>
        </div>

        {/* NO COLLATERAL WARNING */}
        {!hasCollateral && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-red-400 text-xl">⚠️</span>
              <span className="text-red-400 font-semibold text-lg">NO COLLATERAL LOCKED</span>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-gray-400 mb-1">Quantity</div>
            <div className="text-white font-semibold text-xl">{quantity.toString()} WL</div>
          </div>

          {hasCollateral && (
            <div>
              <div className="text-gray-400 mb-1">Collateral Locked</div>
              <div className="text-green-400 font-semibold text-xl">
                ✅ {formatEther(collateral)} ETH
              </div>
            </div>
          )}

          <div>
            <div className="text-gray-400 mb-1">Mint Date</div>
            <div className="text-white font-semibold">{formatMintDate(mintDate)}</div>
          </div>

          {mintDateSet && confirmationDeadline > 0n && (
            <div>
              <div className="text-gray-400 mb-1">Confirm By</div>
              <div className="text-purple-400 font-semibold">
                {formatMintDate(confirmationDeadline)}
              </div>
            </div>
          )}

          <div>
            <div className="text-gray-400 mb-1">Seller</div>
            <div className="text-white font-mono text-sm">
              {seller.slice(0, 6)}...{seller.slice(-4)}
            </div>
          </div>
        </div>
      </div>

      {/* Price Section */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">Price</h3>
        {backendListing?.price ? (
          <>
            <div className="text-4xl font-bold text-primary mb-2">
              {backendListing.price} ETH
            </div>
            <p className="text-gray-400 text-sm">Public price</p>
          </>
        ) : (
          <>
            <div className="text-2xl font-semibold text-purple-400">🔐 Encrypted</div>
            <p className="text-purple-300 text-sm mt-2">
              Price will be visible once backend is linked
            </p>
          </>
        )}
      </div>

      {/* Buy Section */}
      {canBuy && backendListing?.price && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Purchase This Listing</h3>
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary rounded-lg p-4">
              <div className="text-sm text-primary mb-1">You will pay:</div>
              <div className="text-3xl font-bold text-white">
                {backendListing.price} ETH
              </div>
            </div>
            <button
              onClick={handleBuy}
              disabled={isPending || isConfirming}
              className="w-full bg-primary hover:bg-primary/80 text-white py-4 rounded-lg font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? 'Buying...' : isConfirming ? 'Confirming...' : `Buy for ${backendListing.price} ETH`}
            </button>
          </div>
        </div>
      )}

      {canBuy && !backendListing?.price && (
        <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-6">
          <p className="text-yellow-300">
            ⚠️ Price information not available. Please refresh the page or check back soon.
          </p>
        </div>
      )}

      {/* Private Key Section (for buyers) */}
      {isBuyer && status >= 1 && (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Your Private Key</h3>
          {!showPrivateKey ? (
            <button
              onClick={handleGetPrivateKey}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition"
            >
              🔓 Reveal Private Key
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-white break-all">
                {encryptedPrivateKey ? 'Encrypted data - decrypt with your wallet' : 'Loading...'}
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Keep this private! Import to MetaMask and wait for mint day.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {isSuccess && (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-white mb-2">Purchase Successful!</h3>
          <p className="text-gray-300">You can now access the private key above</p>
          <p className="text-sm text-gray-400 mt-2">Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}</p>
        </div>
      )}
    </div>
  );
}
