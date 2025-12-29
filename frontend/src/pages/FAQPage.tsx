import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    // General Questions
    {
      question: "What is the FHE NFT Whitelist Marketplace?",
      answer: "This is a secure marketplace for buying and selling NFT whitelist spots using Fully Homomorphic Encryption (FHE). Sellers can list their whitelist private keys encrypted on-chain, and buyers can purchase them instantly without the seller being able to scam them."
    },
    {
      question: "What does FHE (Fully Homomorphic Encryption) mean?",
      answer: "FHE is a special type of encryption that allows data to remain encrypted even while being processed on-chain. Your private keys are encrypted using Zama's fhEVM technology, ensuring they remain secure and can only be decrypted by the buyer after purchase."
    },
    {
      question: "What blockchain does this run on?",
      answer: "The marketplace currently runs on Ethereum Sepolia Testnet. Make sure your wallet is connected to Sepolia network before creating or buying listings."
    },

    // For Sellers
    {
      question: "How do I list my whitelist spot?",
      answer: "1. Connect your wallet\n2. Click 'Create Listing'\n3. Enter the NFT project name\n4. Provide the whitelist wallet address and private key (will be encrypted)\n5. Set your price in ETH\n6. Set the collateral amount (recommended: 0.001-0.01 ETH)\n7. Optionally set the mint date if known\n8. Submit the transaction\n\nYour private key is encrypted using FHE before being stored on-chain, so only the buyer can decrypt it after purchase."
    },
    {
      question: "What is collateral and why do I need it?",
      answer: "Collateral is a security deposit you lock when creating a listing. It ensures you're committed to providing a valid whitelist spot. If you scam the buyer (steal the NFT, use sniper bots, etc.), the platform admin can give your collateral to the buyer as compensation. If the buyer tries to scam you by claiming they didn't receive the NFT when they did, you get your collateral back plus their payment."
    },
    {
      question: "How much collateral should I set?",
      answer: "Best practice: If you know the NFT mint price, set your collateral to exactly that amount. This fully protects buyers from losing the mint fee if you scam them.\n\nIf mint price is unknown: Set collateral between 0.001 ETH and 0.01 ETH. It should be enough to deter scams but not so high that it's burdensome."
    },
    {
      question: "Can I update the mint date after listing?",
      answer: "Yes! As a seller, you can update the mint date up to 5 times. This is useful if the NFT project delays their mint. Go to your listing details page and use the 'Update Mint Date' section."
    },
    {
      question: "Can I cancel my listing?",
      answer: "Yes, but only BEFORE someone buys it. Once a buyer purchases your listing, you cannot cancel (this prevents you from scamming the buyer). To cancel, go to your listing page and click the 'Cancel Listing' button in the Danger Zone. Your collateral will be returned to you."
    },
    {
      question: "How much do I earn when someone buys my listing?",
      answer: "You receive the listing price minus a 2% platform fee. For example:\n- Listing price: 0.01 ETH\n- Platform fee (2%): 0.0002 ETH\n- You receive: 0.0098 ETH\n\nYour collateral is also returned to you when the buyer confirms successful mint."
    },
    {
      question: "When do I get paid?",
      answer: "You get paid when the buyer confirms they successfully minted the NFT (or when the confirmation deadline passes without dispute). The payment is automatically sent to your wallet address minus the 2% platform fee. Your collateral is also returned at this time."
    },

    // For Buyers
    {
      question: "How do I buy a whitelist spot?",
      answer: "1. Browse active listings on the homepage\n2. Click on a listing to view details\n3. Click 'Buy Listing'\n4. Pay the listing price (the private key is instantly decrypted for you)\n5. Use the revealed private key and wallet address to mint the NFT on mint day\n6. After minting, confirm the transaction within 12 hours"
    },
    {
      question: "How do I get the private key after buying?",
      answer: "After your purchase transaction is confirmed, you'll see a 'Decrypt & View Private Key' button. Click it, sign a message to prove you're the buyer, and the encrypted private key will be decrypted and shown to you. Save this information securely!"
    },
    {
      question: "What do I do with the private key?",
      answer: "The private key gives you access to the whitelist wallet. On the NFT mint day:\n1. Import the private key into a wallet (MetaMask, etc.)\n2. Make sure the wallet has enough ETH for gas + mint fee\n3. Connect to the NFT project's minting page\n4. Mint your NFT\n5. Return to our platform and confirm successful mint within 12 hours"
    },
    {
      question: "What happens if I don't confirm within 12 hours?",
      answer: "If you don't confirm (either 'Mint Successful' or 'Mint Failed') within 12 hours after the mint date, the listing goes under review and the platform admin will investigate to determine the outcome. It's important to confirm promptly to protect your purchase."
    },
    {
      question: "What if the seller scammed me?",
      answer: "If the seller scammed you (used a sniper bot to steal the NFT, wallet had no whitelist access, etc.):\n1. Click 'Mint Failed' on the listing page\n2. The listing goes under review\n3. The platform admin will investigate\n4. If you're found to be right, you'll get your payment back PLUS the seller's collateral as compensation"
    },
    {
      question: "Can I get a refund?",
      answer: "Refunds are only possible after you've purchased a listing if:\n- You prove the seller scammed you by clicking 'Mint Failed' and the admin rules in your favor\n- Technical issues prevent you from accessing the private key\n\nOnce you've successfully minted the NFT and confirmed, refunds are not possible."
    },

    // Technical Questions
    {
      question: "Is my private key safe?",
      answer: "Yes! Your whitelist private key is encrypted using Fully Homomorphic Encryption (FHE) before being stored on-chain. Only the buyer who purchases the listing can decrypt it using their wallet signature. Even the smart contract cannot see the unencrypted private key."
    },
    {
      question: "What is the 2% platform fee?",
      answer: "The platform charges a 2% fee on all successful transactions. This fee is deducted from the seller's payment. For example, if a buyer pays 0.01 ETH, the seller receives 0.0098 ETH (0.01 - 2%)."
    },
    {
      question: "Why do I need to sign a message to decrypt?",
      answer: "The signature proves that you are the actual buyer of the listing. This prevents someone else from trying to decrypt and steal your private key. Only your wallet can create the valid signature needed to decrypt the FHE-encrypted data."
    },
    {
      question: "What happens if there's a dispute?",
      answer: "Disputes are handled by the platform administrator:\n1. When a buyer clicks 'Mint Failed', the listing enters 'Under Review' status\n2. The admin investigates both parties' claims\n3. The admin can choose to either:\n   - Favor the buyer (refund payment + give them seller's collateral)\n   - Favor the seller (release payment + collateral to seller)\n\nThis system ensures fair resolution of conflicts."
    },
    {
      question: "How many times can a seller update the mint date?",
      answer: "Sellers can update the mint date up to 5 times. This limit prevents abuse while allowing legitimate updates if the NFT project delays their mint date."
    },
    {
      question: "What are the different listing statuses?",
      answer: "- Active (Green): Available for purchase\n- Sold (Blue): Purchased, waiting for mint confirmation\n- Under Review (Yellow): Dispute filed, admin investigating\n- Disputed (Orange): Formal dispute opened\n- Completed (Green): Successfully completed transaction\n- Cancelled (Gray): Listing cancelled by seller or admin"
    },

    // Safety & Security
    {
      question: "How does the collateral system protect me?",
      answer: "For Buyers: If a seller scams you, the admin can award you the seller's collateral as compensation on top of your refund.\n\nFor Sellers: If a buyer falsely claims they were scammed, you keep both the payment and your collateral."
    },
    {
      question: "What should I do after buying a listing?",
      answer: "1. Immediately decrypt and save the private key (write it down securely)\n2. Add the wallet to your wallet manager (MetaMask, etc.)\n3. Fund the wallet with enough ETH for gas and mint fee BEFORE mint day\n4. On mint day, mint the NFT using that wallet\n5. Confirm 'Mint Successful' within 12 hours to release payment to seller"
    },
    {
      question: "Can sellers see who bought their listing?",
      answer: "Yes, sellers can see the buyer's wallet address on-chain since all transactions are public on the blockchain."
    },
    {
      question: "What if I accidentally send the wrong private key as a seller?",
      answer: "Unfortunately, you cannot edit the private key after listing. If you realize you made a mistake:\n- Cancel the listing immediately (only works if nobody has bought it yet)\n- Create a new listing with the correct information\n- If someone already bought it, you'll need to work with them and potentially go through dispute resolution"
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-xl text-gray-300">
          Everything you need to know about the FHE NFT Whitelist Marketplace
        </p>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="#general" className="text-primary hover:text-primary/80 transition">
            📚 General Questions
          </a>
          <a href="#sellers" className="text-primary hover:text-primary/80 transition">
            💼 For Sellers
          </a>
          <a href="#buyers" className="text-primary hover:text-primary/80 transition">
            🛒 For Buyers
          </a>
          <a href="#technical" className="text-primary hover:text-primary/80 transition">
            ⚙️ Technical
          </a>
          <a href="#safety" className="text-primary hover:text-primary/80 transition">
            🔒 Safety & Security
          </a>
          <Link to="/" className="text-primary hover:text-primary/80 transition">
            🏠 Back to Home
          </Link>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-gray-800/50 rounded-lg border border-gray-700 overflow-hidden transition-all"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-700/30 transition"
            >
              <span className="text-white font-semibold pr-8">{faq.question}</span>
              <span className="text-primary text-xl flex-shrink-0">
                {openIndex === index ? '−' : '+'}
              </span>
            </button>

            {openIndex === index && (
              <div className="px-6 pb-4 pt-2 text-gray-300 whitespace-pre-line border-t border-gray-700">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Help */}
      <div className="bg-primary/10 border border-primary rounded-lg p-6 text-center">
        <h3 className="text-xl font-semibold text-white mb-3">
          Still have questions?
        </h3>
        <p className="text-gray-300 mb-4">
          Join our community or contact support for additional help
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/"
            className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Browse Listings
          </Link>
          <Link
            to="/create"
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition"
          >
            Create Listing
          </Link>
        </div>
      </div>
    </div>
  );
}
