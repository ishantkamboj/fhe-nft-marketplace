import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'FHE Marketplace',
  projectId: '5ce56057a3af78d645df2129645d6e1f', // Get from https://cloud.walletconnect.com
  chains: [sepolia],
  ssr: false,
});
