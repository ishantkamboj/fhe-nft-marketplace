import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import ListingCard from '@/components/ListingCard';
import { Link } from 'react-router-dom';
import { JsonRpcProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const RPC_URL = 'https://ethereum-sepolia-rpc.publicnode.com';

export default function HomePage() {
  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [lastFetch, setLastFetch] = useState<number>(0);

  // Cache duration: 30 seconds
  const CACHE_DURATION = 30000;

  // Fetch listings from backend
  useEffect(() => {
    // Check cache first
    const cachedData = localStorage.getItem('listings_cache');
    const cachedTime = localStorage.getItem('listings_cache_time');

    if (cachedData && cachedTime) {
      const age = Date.now() - parseInt(cachedTime);
      if (age < CACHE_DURATION) {
        // Use cached data
        setListings(JSON.parse(cachedData));
        setLoading(false);
        setLastFetch(parseInt(cachedTime));
        return;
      }
    }

    // Cache expired or doesn't exist - fetch fresh data
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setError('');

      // Fetch directly from contract instead of backend DB
      const provider = new JsonRpcProvider(RPC_URL);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Get total number of listings
      const listingCount = await contract.listingCount();
      const count = Number(listingCount);

      if (count === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      // Fetch all listings from contract
      const allListings = await Promise.all(
        Array.from({ length: count }, (_, i) => i + 1).map(async (listingId) => {
          try {
            const listing = await contract.getListing(listingId);
            return {
              contractListingId: listingId,
              listingId: Number(listing.listingId),
              seller: listing.seller,
              buyer: listing.buyer,
              nftProject: listing.nftProject,
              quantity: Number(listing.quantity),
              price: Number(listing.price),
              priceInGwei: Number(listing.price),
              collateral: Number(listing.collateral),
              buyerPayment: Number(listing.buyerPayment),
              mintDate: Number(listing.mintDate),
              status: Number(listing.status),
              createdAt: Number(listing.createdAt),
              soldAt: Number(listing.soldAt),
              completedAt: Number(listing.completedAt),
              hasCollateral: listing.hasCollateral,
              mintDateSet: listing.mintDateSet,
              onChain: true,
            };
          } catch (err) {
            console.error(`Failed to fetch listing ${listingId}:`, err);
            return null;
          }
        })
      );

      // Filter out null entries (failed fetches)
      const validListings = allListings.filter((l) => l !== null);
      setListings(validListings);

      // Cache the results
      const now = Date.now();
      localStorage.setItem('listings_cache', JSON.stringify(validListings));
      localStorage.setItem('listings_cache_time', now.toString());
      setLastFetch(now);
    } catch (error: any) {
      console.error('Failed to fetch listings from contract:', error);
      setError(`Failed to load listings: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    setLoading(true);
    fetchListings();
  };

  // Filter listings by search term
  const filteredListings = listings.filter((listing: any) =>
    listing.nftProject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate active and sold listings (status: 0=Active, 1=Sold, 2=Completed, etc.)
  const activeListings = filteredListings.filter((l: any) => l.status === 0);
  const soldListings = filteredListings.filter((l: any) => l.status === 1 || l.status === 2 || l.status === 3);

  const activeCount = activeListings.length;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 px-4">
        <h1 className="text-5xl font-bold text-white mb-4">
          Private NFT Whitelist Marketplace
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Buy and sell WL spots with encrypted private keys and full security
        </p>
        
        {!isConnected ? (
          <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-yellow-300">
              Connect your wallet to start trading
            </p>
          </div>
        ) : (
          <Link to="/create">
            <button className="bg-primary hover:bg-primary/80 text-white px-8 py-3 rounded-lg font-semibold text-lg transition">
              Create Listing
            </button>
          </Link>
        )}
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search NFT projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-6 py-4 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-primary focus:outline-none"
          />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-6 py-4 rounded-lg bg-gray-800 text-white border border-gray-700 hover:border-primary hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh listings"
          >
            🔄
          </button>
        </div>
        {lastFetch > 0 && (
          <p className="text-gray-500 text-sm mt-2 text-center">
            Last updated: {new Date(lastFetch).toLocaleTimeString()}
            {Date.now() - lastFetch > CACHE_DURATION && ' (cached)'}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-gray-800/50 rounded-lg p-6 text-center border border-gray-700">
          <div className="text-3xl font-bold text-primary">
            {activeCount}
          </div>
          <div className="text-gray-400 mt-2">Active Listings</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-6 text-center border border-gray-700">
          <div className="text-3xl font-bold text-green-400">2.5%</div>
          <div className="text-gray-400 mt-2">Platform Fee</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-6 text-center border border-gray-700">
          <div className="text-3xl font-bold text-purple-400">🔐</div>
          <div className="text-gray-400 mt-2">FHE Encrypted</div>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="text-red-400 text-2xl">⚠️</div>
            <div>
              <h3 className="text-red-400 font-semibold mb-2">Error Loading Listings</h3>
              <p className="text-red-300 text-sm mb-4">{error}</p>
              <button
                onClick={() => {
                  setLoading(true);
                  fetchListings();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="bg-gray-800/50 rounded-lg p-12 text-center border border-gray-700">
          <div className="animate-pulse">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-400 text-lg">Loading listings...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Active Listings */}
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white">Active Listings</h2>
            {activeListings.length === 0 ? (
              <div className="bg-gray-800/50 rounded-lg p-12 text-center border border-gray-700">
                <p className="text-gray-400 text-lg">No active listings yet</p>
                <p className="text-gray-500 mt-2">Be the first to create one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeListings.map((listing: any) => (
                  <ListingCard
                    key={listing.contractListingId || listing.id}
                    listing={listing}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sold Listings */}
          {soldListings.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Sold Listings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {soldListings.map((listing: any) => (
                  <ListingCard
                    key={listing.contractListingId || listing.id}
                    listing={listing}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* How It Works */}
      <div className="bg-gray-800/30 rounded-lg p-8 border border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">📝</div>
            <div className="font-semibold text-white mb-2">1. List WL</div>
            <div className="text-gray-400 text-sm">
              Seller uploads encrypted private key & sets price
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💰</div>
            <div className="font-semibold text-white mb-2">2. Buy</div>
            <div className="text-gray-400 text-sm">
              Buyer pays & gets private key instantly
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🎨</div>
            <div className="font-semibold text-white mb-2">3. Mint</div>
            <div className="text-gray-400 text-sm">
              Use private key to mint NFT on mint day
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-semibold text-white mb-2">4. Confirm</div>
            <div className="text-gray-400 text-sm">
              Confirm within 12h to release funds
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
