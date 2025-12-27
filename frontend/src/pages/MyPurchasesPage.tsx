import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import ListingCard from '@/components/ListingCard';

export default function MyPurchasesPage() {
  const { address, isConnected } = useAccount();

  const { data: myPurchases } = useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CONTRACT_ABI,
    functionName: 'getBuyerPurchases',
    args: address ? [address] : undefined,
  });

  if (!isConnected) {
    return (
      <div className="text-center">
        <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-2">Connect Wallet</h2>
          <p className="text-gray-300">Please connect your wallet to view your purchases</p>
        </div>
      </div>
    );
  }

  const purchasesArray = myPurchases as bigint[] | undefined;

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-white">My Purchases</h1>

      {!purchasesArray || purchasesArray.length === 0 ? (
        <div className="bg-gray-800/50 rounded-lg p-12 text-center border border-gray-700">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-2xl font-bold text-white mb-2">No Purchases Yet</h3>
          <p className="text-gray-400">Browse active listings to make your first purchase</p>
        </div>
      ) : (
        <div>
          <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4 mb-6">
            <p className="text-blue-300 text-sm">
              💡 Click on a listing to reveal your private key and confirm after minting
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchasesArray.map((id: bigint) => (
              <ListingCard key={id.toString()} listingId={id} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
