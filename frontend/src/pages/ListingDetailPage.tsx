import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI, LISTING_STATUS } from '@/lib/contract';
import { formatEther, parseEther } from 'ethers';
import { decryptListingData } from '@/lib/fhe';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = BigInt(params.id as string);
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [backendListing, setBackendListing] = useState<any>(null);
  const [decryptedPrivateKey, setDecryptedPrivateKey] = useState<string>('');
  const [decryptedWallet, setDecryptedWallet] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionError, setDecryptionError] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [backendError, setBackendError] = useState<string>('');

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
        setBackendError('');
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
            setBackendError('Listing metadata not found in backend');
          }
        } else {
          setBackendError(`Backend error: ${response.status}`);
        }
      } catch (error: any) {
        console.error('Failed to fetch backend data:', error);
        setBackendError(`Failed to connect to backend: ${error.message || 'Network error'}`);
      }
    };

    fetchBackendData();
  }, [listingId]);

  console.log('📋 Listing data from contract:', listing);
  console.log('📋 Listing type:', typeof listing);
  console.log('📋 Is array?', Array.isArray(listing));

  if (!listing) {
    return (
      <div className="text-center text-white py-12">
        <div className="text-6xl mb-4">⏳</div>
        <p className="text-xl">Loading listing...</p>
      </div>
    );
  }

  // Check if listing is valid (contract returns data)
  if (!Array.isArray(listing) && typeof listing !== 'object') {
    return (
      <div className="text-center text-white py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-xl">Listing not found on contract</p>
        <p className="text-sm text-gray-400 mt-2">ID: {listingId.toString()}</p>
        {backendListing && (
          <p className="text-sm text-yellow-400 mt-2">
            Found in backend but not yet confirmed on blockchain
          </p>
        )}
      </div>
    );
  }

  // Destructure listing object (wagmi returns objects, not arrays)
  const {
    listingId: id,
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
  } = listing as any;

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

  // Refetch listing after successful transaction
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        refetch();
      }, 2000);
    }
  }, [isSuccess, refetch]);

  const handleGetPrivateKey = async () => {
    if (!walletClient) {
      setDecryptionError('Wallet not connected');
      return;
    }

    setShowPrivateKey(true);
    setIsDecrypting(true);
    setDecryptionError('');

    try {
      console.log('🔑 Starting FHE decryption...');
      console.log('Encrypted private key (32 euint8 values):', encryptedPrivateKey);
      console.log('Encrypted wallet (20 euint8 values):', encryptedSellerWallet);

      // Decrypt using Zama's free Gateway on Sepolia
      const result = await decryptListingData(
        CONTRACT_ADDRESS,
        listingId,
        encryptedPrivateKey,
        encryptedSellerWallet,
        walletClient
      );

      if (result.error) {
        setDecryptionError(result.error);
      } else {
        setDecryptedPrivateKey(result.privateKey || '');
        setDecryptedWallet(result.walletAddress || '');
        console.log('✅ Decryption successful!');
      }

    } catch (error: any) {
      console.error('Error decrypting data:', error);
      setDecryptionError(error.message || 'Failed to decrypt data. Make sure you are the buyer and have permission.');
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleConfirmMint = (success: boolean) => {
    writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: CONTRACT_ABI,
      functionName: 'confirmMint',
      args: [listingId, success, confirmationNotes || ''],
    });
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

      {/* Backend Error Alert */}
      {backendError && (
        <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <span className="text-yellow-400">⚠️</span>
            <div>
              <p className="text-yellow-300 text-sm font-semibold">Backend Connection Issue</p>
              <p className="text-yellow-200 text-xs mt-1">{backendError}</p>
            </div>
          </div>
        </div>
      )}

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
              disabled={isDecrypting}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDecrypting ? '🔄 Loading...' : '🔓 Reveal Private Key'}
            </button>
          ) : (
            <div className="space-y-4">
              {isDecrypting ? (
                <div className="bg-gray-900 rounded-lg p-4 text-center">
                  <div className="text-white">🔄 Accessing encrypted data...</div>
                </div>
              ) : decryptedPrivateKey ? (
                <>
                  <div>
                    <label className="text-gray-400 text-sm block mb-2">Private Key:</label>
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 break-all">
                      {decryptedPrivateKey}
                    </div>
                  </div>
                  {decryptedWallet && (
                    <div>
                      <label className="text-gray-400 text-sm block mb-2">Seller Wallet:</label>
                      <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-blue-400 break-all">
                        {decryptedWallet}
                      </div>
                    </div>
                  )}
                  <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
                    <p className="text-yellow-300 text-sm">
                      ⚠️ Keep this private! Import to MetaMask and wait for mint day.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
                    <p className="text-blue-300 text-sm font-semibold mb-2">🔐 Encrypted Data Available</p>
                    <p className="text-blue-200 text-xs">
                      {decryptionError || 'You have permission to access this data. Decryption in progress...'}
                    </p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-2">Encrypted Private Key (32 bytes):</div>
                    <div className="font-mono text-xs text-gray-500 break-all">
                      {JSON.stringify(encryptedPrivateKey).slice(0, 150)}...
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-gray-400 text-xs mb-2">Encrypted Seller Wallet (20 bytes):</div>
                    <div className="font-mono text-xs text-gray-500 break-all">
                      {JSON.stringify(encryptedSellerWallet).slice(0, 150)}...
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mint Confirmation Section (for buyers after purchase) */}
      {isBuyer && status === 1 && (
        <div className="bg-purple-500/10 border border-purple-500 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Confirm Mint Status</h3>

          {!showConfirmation ? (
            <>
              <p className="text-gray-300 mb-4">
                After using the private key to mint, confirm whether the mint was successful or if there were any issues.
              </p>
              <button
                onClick={() => setShowConfirmation(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
              >
                Confirm Mint Status
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-gray-300 text-sm block mb-2">
                  Notes (optional):
                </label>
                <textarea
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  placeholder="Any issues or notes about the mint..."
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleConfirmMint(true)}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Confirming...' : '✅ Mint Successful'}
                </button>
                <button
                  onClick={() => handleConfirmMint(false)}
                  disabled={isPending}
                  className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Reporting...' : '❌ Mint Failed'}
                </button>
              </div>

              <button
                onClick={() => setShowConfirmation(false)}
                className="text-gray-400 hover:text-white text-sm underline"
              >
                Cancel
              </button>

              <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 mt-4">
                <p className="text-blue-300 text-xs">
                  💡 <strong>Success:</strong> Releases payment to seller + collateral<br/>
                  💡 <strong>Failed:</strong> Opens dispute for manual review
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Deadline Warning */}
      {isBuyer && status === 1 && confirmationDeadline > 0n && (
        <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
          <p className="text-yellow-300 text-sm">
            ⏰ Please confirm by: <strong>{formatMintDate(confirmationDeadline)}</strong>
          </p>
        </div>
      )}

      {/* Success Message */}
      {isSuccess && (
        <div className="bg-green-500/10 border border-green-500 rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-white mb-2">Transaction Successful!</h3>
          <p className="text-gray-300">Your transaction has been confirmed</p>
          <p className="text-sm text-gray-400 mt-2">Transaction: {hash?.slice(0, 10)}...{hash?.slice(-8)}</p>
        </div>
      )}
    </div>
  );
}
