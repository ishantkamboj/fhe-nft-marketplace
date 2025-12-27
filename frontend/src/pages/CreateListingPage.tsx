import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';
import { parseEther } from 'ethers';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function CreateListingPage() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Debug connection status
  useEffect(() => {
    console.log('📡 Connection status changed:');
    console.log('  isConnected:', isConnected);
    console.log('  address:', address);
  }, [isConnected, address]);

  // Debug transaction status
  useEffect(() => {
    console.log('📝 Transaction status:');
    console.log('  isPending:', isPending);
    console.log('  hash:', hash);
    console.log('  isConfirming:', isConfirming);
    console.log('  isSuccess:', isSuccess);
    if (writeError) {
      console.error('  writeError:', writeError);
    }
  }, [isPending, hash, isConfirming, isSuccess, writeError]);

  const [formData, setFormData] = useState({
    nftProject: '',
    quantity: '1',
    price: '',
    sellerWallet: address || '',
    privateKey: '',
    collateral: '',
    mintDate: '',
  });

  const [isEncrypting, setIsEncrypting] = useState(false);
  const [tempListingId, setTempListingId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CRITICAL CHECKS
    console.log('🔍 Pre-flight checks:');
    console.log('  isConnected:', isConnected);
    console.log('  address:', address);
    console.log('  CONTRACT_ADDRESS:', CONTRACT_ADDRESS);
    
    if (!isConnected) {
      alert('❌ Wallet not connected! Please connect MetaMask first.');
      return;
    }
    
    if (!address) {
      alert('❌ No wallet address found! Please reconnect MetaMask.');
      return;
    }

    setIsEncrypting(true);

    try {
      // Call backend to encrypt
      console.log('Calling backend to encrypt...');
      const response = await fetch(`${BACKEND_URL}/api/encrypt-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nftProject: formData.nftProject,
          quantity: parseInt(formData.quantity),
          price: formData.price,
          collateral: formData.collateral || '0',
          mintDate: formData.mintDate 
            ? Math.floor(new Date(formData.mintDate).getTime() / 1000)
            : 0,
          sellerWallet: formData.sellerWallet,
          privateKey: formData.privateKey,
          contractAddress: CONTRACT_ADDRESS,
          userAddress: address,
        }),
      });

      if (!response.ok) {
        throw new Error('Backend encryption failed');
      }

      const { encrypted, publicData } = await response.json();
      console.log('✅ Encryption successful!', publicData);
      console.log('📦 Encrypted data:', encrypted);

      setTempListingId(publicData.id);

      // Convert handles using EXACT method from working test script
      const handleToBytes32 = (handleObj: any): string => {
        // If already a string, return it
        if (typeof handleObj === 'string') return handleObj;
        
        // Convert object with numeric keys to Uint8Array then hex
        const bytes = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
          bytes[i] = handleObj[i] || 0;
        }
        // Use vanilla JS to convert to hex (no ethers dependency)
        return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      };
      
      const priceHandle = handleToBytes32(encrypted.price);
      const walletHandles = encrypted.wallet.map(handleToBytes32);
      const keyHandles = encrypted.privateKey.map(handleToBytes32);
      
      // Convert proof (it's also an object with numeric keys)
      const proofBytes = new Uint8Array(Object.values(encrypted.proof) as number[]);
      const proof = '0x' + Array.from(proofBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      console.log('🔧 Converted handles (using working format):');
      console.log('  Price:', priceHandle.substring(0, 20) + '...');
      console.log('  Wallet handles:', walletHandles.length, 'x bytes32');
      console.log('  Key handles:', keyHandles.length, 'x bytes32');
      console.log('  Proof length:', proof.length, 'chars');

      // Log the EXACT args we're sending
      const args = [
        formData.nftProject,
        BigInt(formData.quantity),
        priceHandle,
        walletHandles,
        keyHandles,
        proof,
        parseEther(formData.collateral || '0'),
        BigInt(publicData.mintDate),
      ];
      
      console.log('📋 Contract call arguments:');
      console.log('  [0] nftProject:', args[0]);
      console.log('  [1] quantity:', args[1].toString());
      console.log('  [2] priceHandle:', args[2]);
      console.log('  [3] walletHandles length:', args[3].length);
      console.log('  [4] keyHandles length:', args[4].length);
      console.log('  [5] proof length:', args[5].length);
      console.log('  [6] collateral:', args[6].toString());
      console.log('  [7] mintDate:', args[7].toString());

      // Create listing on contract (EXACT same format as test script!)
      console.log('📝 About to call writeContract...');
      console.log('   Contract address:', CONTRACT_ADDRESS);
      console.log('   Function:', 'createListing');
      console.log('   Value (collateral):', parseEther(formData.collateral || '0').toString());
      
      try {
        console.log('🚀 Calling writeContract with config:');
        console.log({
          address: CONTRACT_ADDRESS,
          functionName: 'createListing',
          argsLength: args.length,
          value: parseEther(formData.collateral || '0').toString()
        });
        
        const result = writeContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: CONTRACT_ABI,
          functionName: 'createListing',
          args: args as any,
          value: parseEther(formData.collateral || '0'),
        });
        
        console.log('✅ writeContract returned:', result);
        console.log('   Type:', typeof result);
        console.log('⏳ Waiting for MetaMask popup...');
        
        // Check if wallet is still connected
        setTimeout(() => {
          if (!hash && !isPending) {
            console.error('❌ No transaction hash after 5 seconds!');
            console.error('   isPending:', isPending);
            console.error('   hash:', hash);
            console.error('   This usually means MetaMask rejected silently');
            alert('⚠️ Transaction not started! Check:\n1. Is MetaMask unlocked?\n2. Are you on Sepolia network?\n3. Do you have enough ETH?');
            setIsEncrypting(false);
          }
        }, 5000);
        
      } catch (writeError: any) {
        console.error('❌ writeContract threw error:', writeError);
        console.error('Error name:', writeError?.name);
        console.error('Error message:', writeError?.message);
        console.error('Error code:', writeError?.code);
        console.error('Error stack:', writeError?.stack);
        throw writeError;
      }
      
      setIsEncrypting(false); // Reset state after submission

    } catch (error) {
      console.error('❌ Error creating listing:', error);
      alert('Failed to create listing: ' + (error as Error).message);
      setIsEncrypting(false);
    }
  };

  // Link temp listing to contract after success
  if (isSuccess && tempListingId && hash) {
    // Link the listing
    fetch(`${BACKEND_URL}/api/listings/${tempListingId}/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listingId: 1, // You'd get this from contract event
        txHash: hash,
      }),
    }).then(() => {
      setTimeout(() => navigate('/'), 2000);
    });

    return (
      <div className="max-w-2xl mx-auto bg-green-500/10 border border-green-500 rounded-lg p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-white mb-2">Listing Created!</h2>
        <p className="text-gray-300">Redirecting to homepage...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-8">Create New Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800/50 rounded-lg p-8 border border-gray-700">
        {/* NFT Project */}
        <div>
          <label className="block text-white font-semibold mb-2">
            NFT Project Name *
          </label>
          <input
            type="text"
            required
            placeholder="Azuki, Pudgy Penguins, etc."
            value={formData.nftProject}
            onChange={(e) => setFormData({...formData, nftProject: e.target.value})}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-primary focus:outline-none"
          />
          <p className="text-gray-400 text-sm mt-1">This will be publicly visible</p>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-white font-semibold mb-2">
            Number of WL Spots *
          </label>
          <input
            type="number"
            required
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-white font-semibold mb-2">
            Price (ETH) *
          </label>
          <input
            type="number"
            required
            step="0.001"
            placeholder="0.1"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-primary focus:outline-none"
          />
          <p className="text-green-400 text-sm mt-1">✅ Will be visible to buyers!</p>
        </div>

        {/* Seller Wallet */}
        <div>
          <label className="block text-white font-semibold mb-2">
            Your Receiving Wallet *
          </label>
          <input
            type="text"
            required
            placeholder="0x..."
            value={formData.sellerWallet}
            onChange={(e) => setFormData({...formData, sellerWallet: e.target.value})}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-primary focus:outline-none"
          />
          <p className="text-purple-400 text-sm mt-1">🔐 Will be encrypted (only buyer sees)</p>
        </div>

        {/* Private Key */}
        <div>
          <label className="block text-white font-semibold mb-2">
            WL Wallet Private Key *
          </label>
          <textarea
            required
            placeholder="0x1234567890abcdef..."
            rows={3}
            value={formData.privateKey}
            onChange={(e) => setFormData({...formData, privateKey: e.target.value})}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-primary focus:outline-none font-mono text-sm"
          />
          <p className="text-purple-400 text-sm mt-1">🔐 Will be encrypted - buyer gets this after payment</p>
        </div>

        {/* Collateral */}
        <div>
          <label className="block text-white font-semibold mb-2">
            Collateral (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            placeholder="0.05 (optional, but recommended)"
            value={formData.collateral}
            onChange={(e) => setFormData({...formData, collateral: e.target.value})}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-primary focus:outline-none"
          />
          {!formData.collateral && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-3 mt-2">
              <p className="text-red-400 text-sm">
                ⚠️ NO COLLATERAL - Buyers will see a warning. Lock mint fee to build trust!
              </p>
            </div>
          )}
          {formData.collateral && (
            <p className="text-green-400 text-sm mt-1">
              ✅ You'll get this back when deal completes
            </p>
          )}
        </div>

        {/* Mint Date */}
        <div>
          <label className="block text-white font-semibold mb-2">
            Mint Date & Time
          </label>
          <input
            type="datetime-local"
            value={formData.mintDate}
            onChange={(e) => setFormData({...formData, mintDate: e.target.value})}
            className="w-full px-4 py-3 rounded-lg bg-gray-900 text-white border border-gray-700 focus:border-primary focus:outline-none"
          />
          <p className="text-gray-400 text-sm mt-1">
            Leave empty if TBD - you can update later (max 1 year)
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending || isEncrypting || isConfirming}
          className="w-full bg-primary hover:bg-primary/80 text-white py-4 rounded-lg font-semibold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEncrypting ? 'Encrypting (53 values)...' : isPending ? 'Creating...' : isConfirming ? 'Confirming...' : 'Create Listing'}
        </button>

        {!isConnected && (
          <p className="text-red-400 text-center">Please connect your wallet</p>
        )}
      </form>
    </div>
  );
}
