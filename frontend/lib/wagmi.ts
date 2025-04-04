import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

export const wagmiConfig = getDefaultConfig({
  appName: 'Simple Storage App',
  projectId: '0e011a7dafb96ed999ec1f44c5824370',
  chains: [sepolia, mainnet],
  transports: { 
    [sepolia.id]: http('https://sepolia.infura.io/v3/f63336cd46ea40d68f1577991e1135cf'), 
    [mainnet.id]: http('https://mainnet.infura.io/v3/f63336cd46ea40d68f1577991e1135cf'), 
  },
  // Disable SSR for Wagmi to avoid hydration issues
  ssr: false,
});
