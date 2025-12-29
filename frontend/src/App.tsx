import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from './lib/wagmi';

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CreateListingPage from './pages/CreateListingPage';
import ListingDetailPage from './pages/ListingDetailPage';
import MyListingsPage from './pages/MyListingsPage';
import MyPurchasesPage from './pages/MyPurchasesPage';
import FAQPage from './pages/FAQPage';

import '@rainbow-me/rainbowkit/styles.css';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/create" element={<CreateListingPage />} />
                  <Route path="/listing/:id" element={<ListingDetailPage />} />
                  <Route path="/my-listings" element={<MyListingsPage />} />
                  <Route path="/my-purchases" element={<MyPurchasesPage />} />
                  <Route path="/faq" element={<FAQPage />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
