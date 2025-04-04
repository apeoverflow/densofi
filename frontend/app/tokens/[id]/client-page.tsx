'use client';

import { useEffect, useState } from 'react';
import { WalletProvider } from '@/components/WalletProvider';
import { WalletConnectButton } from "@/components/WalletConnectButton";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

export function TokenPageClient({ id }: { id: string }) {
  // Client-side only flag
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Don't render anything during SSR
  if (!isClient) {
    return null;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-900 to-black overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute top-1/3 right-1/3 w-1/3 h-1/3 bg-teal-500/10 rounded-full blur-3xl"></div>
            </div>
            
            <header className="relative z-10 backdrop-blur-md bg-black/20 border-b border-white/10">
              <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-white font-bold text-xl">
                  <Link href="/">Denso.fi</Link>
                </div>
                <div className="flex items-center gap-4">
                  <Link href="/tokens" className="text-white hover:text-blue-400">
                    All Tokens
                  </Link>
                  <WalletConnectButton />
                </div>
              </div>
            </header>

            <main className="relative z-10 flex-grow container mx-auto px-4 py-12">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-bold text-white mb-6">
                    Token {id}
                  </h1>
                  <p className="text-gray-300 max-w-2xl mx-auto">
                    Detailed view of this tokenized domain
                  </p>
                </div>
                
                <div className="mt-8">
                  <GlassCard className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Domain Token Details</h2>
                    <p className="text-lg text-gray-300 mb-8">
                      This page will contain token-specific information and functionality.
                    </p>
                  </GlassCard>
                </div>
              </div>
            </main>

            <footer className="relative z-10 backdrop-blur-md bg-black/20 border-t border-white/10 py-10">
              <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Denso.fi</h3>
                    <p className="text-gray-400">Unlocking value and utility for domain names through fractional ownership and tokenization.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-4">Quick Links</h4>
                    <div className="space-y-2">
                      <Link href="/tokens" className="block text-gray-400 hover:text-white">Explore Tokens</Link>
                      <Link href="/new-page" className="block text-gray-400 hover:text-white">Documentation</Link>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-4">Connect</h4>
                    <div className="space-y-2">
                      <a href="#" className="block text-gray-400 hover:text-white">Discord</a>
                      <a href="#" className="block text-gray-400 hover:text-white">Twitter</a>
                    </div>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/10 text-center text-gray-500 text-sm">
                  <p>© 2024 Denso.fi. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </div>
  );
}