import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import ListingCard from '@/components/ListingCard';
import { Link } from 'react-router-dom';
import { BrowserProvider, Contract } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function HomePage() {
  const { isConnected } = useAccount();
  const [searchTerm, setSearchTerm] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch listings from backend
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setError('');
      const response = await fetch(`${BACKEND_URL}/api/listings`);
      if (!response.ok) {
        setError(`Failed to load listings: Server returned ${response.status}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      const backendListings = data.listings || [];

      // Filter out pending listings (not on-chain)
      const onChainListings = backendListings.filter((l: any) => l.onChain && l.contractListingId != null);

      if (onChainListings.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      // Fetch contract data to get status for each on-chain listing
      try {
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        const enrichedListings = await Promise.all(
          onChainListings.map(async (listing: any) => {
            try {
              const contractListing = await contract.getListing(listing.contractListingId);
              return {
                ...listing,
                status: contractListing.status, // 0=Active, 1=Sold, 2=Completed, etc.
                buyer: contractListing.buyer,
                soldAt: contractListing.soldAt ? Number(contractListing.soldAt) : null,
              };
            } catch (err) {
              console.error(`Failed to fetch contract data for listing ${listing.contractListingId}:`, err);
              return listing; // Return original if fetch fails
            }
          })
        );

        setListings(enrichedListings);
      } catch (err) {
        console.error('Failed to fetch contract data:', err);
        // Fallback: show backend listings without contract data
        setListings(onChainListings);
      }
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      setError(`Failed to connect to backend: ${error.message || 'Network error'}`);
    } finally {
      setLoading(false);
    }
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
        <input
          type="text"
          placeholder="Search NFT projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-6 py-4 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-primary focus:outline-none"
        />
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
