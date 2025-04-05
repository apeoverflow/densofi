'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from "@/lib/wagmi";
import '@rainbow-me/rainbowkit/styles.css';
import { sepolia } from 'wagmi/chains';

/**
 * Global wallet provider component that should be used once at the top level
 * to prevent multiple WalletConnect initializations
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  // Create QueryClient once
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={sepolia}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}