import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

export default function Navbar() {
  const { isConnected } = useAccount();

  return (
    <nav className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🔐</span>
            <span className="text-xl font-bold text-white">
              WL Marketplace
            </span>
          </Link>

          <div className="flex items-center space-x-6">
            {isConnected && (
              <>
                <Link to="/create" className="text-gray-300 hover:text-white transition">
                  Create Listing
                </Link>
                <Link to="/my-listings" className="text-gray-300 hover:text-white transition">
                  My Listings
                </Link>
                <Link to="/my-purchases" className="text-gray-300 hover:text-white transition">
                  My Purchases
                </Link>
              </>
            )}
            
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
