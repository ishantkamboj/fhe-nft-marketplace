import { Link } from 'react-router-dom';

interface ListingCardProps {
  listing: any; // Backend listing object with public metadata
}

export default function ListingCard({ listing }: ListingCardProps) {
  const formatMintDate = (timestamp: number) => {
    if (!timestamp || timestamp === 0) return 'TBD';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  const listingId = listing.contractListingId || listing.id;

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden hover:border-primary transition">
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{listing.nftProject}</h3>
            <p className="text-gray-400">Quantity: {listing.quantity}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">ID #{listingId}</div>
          </div>
        </div>

        {/* Price - NOW PUBLIC! */}
        <div className="bg-primary/10 border border-primary rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-primary text-sm">Price:</span>
            <span className="text-white font-bold text-xl">
              {listing.price} ETH
            </span>
          </div>
        </div>

        {/* Collateral Status */}
        {listing.collateral > 0 ? (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm">✅ Collateral Locked</span>
              <span className="text-green-400 font-semibold">
                {listing.collateral} ETH
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-red-400 font-semibold text-sm">NO COLLATERAL</span>
            </div>
          </div>
        )}

        {/* Mint Date */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Mint Date:</span>
            <span className="text-white font-semibold">
              {formatMintDate(listing.mintDate)}
            </span>
          </div>
        </div>

        {/* Seller */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Seller:</span>
          <span className="text-white font-mono text-xs">
            {listing.seller?.slice(0, 6)}...{listing.seller?.slice(-4)}
          </span>
        </div>

        {/* Status Badge */}
        {listing.onChain ? (
          <div className="bg-green-500/10 border border-green-500 rounded px-2 py-1 text-center">
            <span className="text-green-400 text-xs font-semibold">ACTIVE</span>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500 rounded px-2 py-1 text-center">
            <span className="text-yellow-400 text-xs font-semibold">PENDING</span>
          </div>
        )}

        {/* Action Button */}
        <Link to={`/listing/${listingId}`}>
          <button className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-lg font-semibold transition">
            View Details
          </button>
        </Link>
      </div>
    </div>
  );
}
