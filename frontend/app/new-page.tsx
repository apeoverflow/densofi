'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from "@/lib/wagmi";
import '@rainbow-me/rainbowkit/styles.css';
import { sepolia } from 'wagmi/chains';
import { WalletConnectButton } from "@/components/WalletConnectButton";
import Link from "next/link";

export default function NewPage() {
  // Client-side only flag
  const [isClient, setIsClient] = useState(false);
  const [queryClient] = useState(() => new QueryClient());
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Don't render anything during SSR
  if (!isClient) {
    return null;
  }
  
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={sepolia}>
          <div className="flex flex-col min-h-screen">
            <header className="backdrop-blur-md bg-black/20 border-b border-white/10">
              <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-white font-bold text-xl">
                  Denso.fi
                </div>
                <WalletConnectButton />
              </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-12">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-bold text-white mb-6">
                    New Page
                  </h1>
                  <p className="text-gray-300 max-w-2xl mx-auto">
                    This is a new blank page following the Denso.fi design system. You can add your custom content here.
                  </p>
                </div>

                <div className="bg-slate-800/50 border border-white/10 rounded-lg p-6 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-4">Content Section</h2>
                  <p className="text-gray-300">
                    Add your components and content in this section. This page is set up with the same providers
                    and styling as the main application, ensuring a consistent look and functionality.
                  </p>
                </div>
              </div>
            </main>

            <footer className="backdrop-blur-md bg-black/20 border-t border-white/10 py-6">
              <div className="container mx-auto px-4 text-center text-white/60 text-sm">
                <p>
                  Built with Next.js, Wagmi, and RainbowKit. Contract at{" "}
                  <Link 
                    href={`https://sepolia.etherscan.io/address/0x7C1bF65D5ec86b526680ec0f195C115c17a90797`}
                    target="_blank"
                    className="text-blue-400 hover:underline"
                  >
                    0x7C1bF65D5ec86b526680ec0f195C115c17a90797
                  </Link>
                </p>
              </div>
            </footer>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 