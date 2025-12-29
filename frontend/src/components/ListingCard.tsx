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

  // Get status info
  const getStatusInfo = () => {
    const status = listing.status ?? -1;
    switch (status) {
      case 0:
        return { text: 'ACTIVE', color: 'green' };
      case 1:
        return { text: 'SOLD', color: 'blue' };
      case 2:
        return { text: 'COMPLETED', color: 'purple' };
      case 3:
        return { text: 'UNDER REVIEW', color: 'yellow' };
      case 4:
        return { text: 'DISPUTED', color: 'red' };
      case 5:
        return { text: 'CANCELLED', color: 'gray' };
      default:
        return listing.onChain
          ? { text: 'ACTIVE', color: 'green' }
          : { text: 'PENDING', color: 'yellow' };
    }
  };

  const statusInfo = getStatusInfo();
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
              {(listing.price || 0).toFixed(4)} ETH
            </span>
          </div>
        </div>

        {/* Collateral Status */}
        {listing.collateral > 0 ? (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-green-400 text-sm">✅ Collateral Locked</span>
              <span className="text-green-400 font-semibold">
                {(listing.collateral || 0).toFixed(4)} ETH
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
        <div className={`bg-${statusInfo.color}-500/10 border border-${statusInfo.color}-500 rounded px-2 py-1 text-center`}>
          <span className={`text-${statusInfo.color}-400 text-xs font-semibold`}>{statusInfo.text}</span>
        </div>

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
