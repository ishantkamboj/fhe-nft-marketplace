import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import ListingCard from '@/components/ListingCard';
import { Link } from 'react-router-dom';

export default function MyListingsPage() {
  const { address, isConnected } = useAccount();

  const { data: myListings } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getSellerListings',
    args: address ? [address] : undefined,
  });

  if (!isConnected) {
    return (
      <div className="text-center">
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
          <p className="text-gray-300">Please connect your wallet to view your listings</p>
        </div>
      </div>
    );
  }

  const listingsArray = myListings as bigint[] | undefined;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-white">My Listings</h1>
        <Link to="/create">
          <button className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-semibold transition">
            + Create New Listing
          </button>
        </Link>
      </div>

      {!listingsArray || listingsArray.length === 0 ? (
        <div className="bg-gray-800/50 rounded-lg p-12 text-center border border-gray-700">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-2xl font-bold text-white mb-2">No Listings Yet</h3>
          <p className="text-gray-400 mb-6">Create your first listing to get started</p>
          <Link to="/create">
            <button className="bg-primary hover:bg-primary/80 text-white px-6 py-3 rounded-lg font-semibold transition">
              Create Listing
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listingsArray.map((id: bigint) => (
            <ListingCard key={id.toString()} listingId={id} />
          ))}
        </div>
      )}
    </div>
  );
}
