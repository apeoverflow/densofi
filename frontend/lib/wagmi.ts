import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, /* sepolia, */ flowMainnet, flowTestnet, celo, celoAlfajores, worldchain, worldchainSepolia} from 'wagmi/chains';
import { http } from 'wagmi';

export const wagmiConfig = getDefaultConfig({
  appName: 'Densofi',
  projectId: "ff3f43403a454a58b7132ab2977ab740",
  chains: [flowMainnet], // sepolia],
    //  mainnet, , flowTestnet, celo, celoAlfajores, worldchain, worldchainSepolia],
  transports: { 
    [flowMainnet.id]: http(), 
    // [sepolia.id]: http('https://sepolia.infura.io/v3/f63336cd46ea40d68f1577991e1135cf'), 
    // [flowTestnet.id]: http(), 
    // [mainnet.id]: http('https://mainnet.infura.io/v3/f63336cd46ea40d68f1577991e1135cf'), 
    // [celo.id]: http(), 
    // [celoAlfajores.id]: http(), 
    // [worldchain.id]: http(), 
    // [worldchainSepolia.id]: http(), 
  },
  // Disable SSR for Wagmi to avoid hydration issues
  ssr: false,
});
