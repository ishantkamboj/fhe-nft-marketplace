import { useState, useEffect } from 'react';
import ListingCard from './ListingCard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ListingCardByIdProps {
  listingId: bigint;
}

export default function ListingCardById({ listingId }: ListingCardByIdProps) {
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(false);
        const response = await fetch(`${BACKEND_URL}/api/listings/${listingId.toString()}`);

        if (response.ok) {
          const data = await response.json();
          setListing(data.listing);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch listing:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded mb-4"></div>
        <div className="h-4 bg-gray-700 rounded mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-red-500/10 rounded-lg border border-red-500 p-6">
        <div className="text-red-400 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm">Failed to load listing #{listingId.toString()}</div>
        </div>
      </div>
    );
  }

  return <ListingCard listing={listing} />;
}
