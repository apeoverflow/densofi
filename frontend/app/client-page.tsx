'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";

export default function ClientPage() {
  // Client-side only flag
  const [isClient, setIsClient] = useState(false);
  
  // Mock token data
  const mockTokens = [
    { id: '1', name: 'crypto.eth', price: '15.3 ETH', liquidity: '256.2 ETH' },
    { id: '2', name: 'defi.eth', price: '10.7 ETH', liquidity: '180.5 ETH' },
    { id: '3', name: 'nft.eth', price: '12.8 ETH', liquidity: '204.1 ETH' },
  ];
  
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
        
        <main className="relative z-10 flex-grow">
              {/* Hero Section */}
              <section className="py-20 md:py-32 relative overflow-hidden">
                <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                  <div className="max-w-2xl">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                      Unlocking price discovery and liquidity for domain names
                    </h1>
                    <div className="text-lg text-gray-300 space-y-4 mb-8">
                      <p>Fractional tokenization (ERC20) of domain names with launchpad mechanics and liquidity pools.</p>
                      <p>Enabling NFT to ERC20 support and subdomain registration for utility.</p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <Link href="/tokens">
                        <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 transition-all">
                          Get Started
                        </Button>
                      </Link>
                      <Link href="/tokens">
                        <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10">
                          View Launched Tokens
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] animate-float">
                      <Image 
                        src="/dino.png" 
                        alt="Dino mascot" 
                        width={400} 
                        height={400}
                        className="object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.3)]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -z-10"></div>
                    </div>
                  </div>
                </div>
              </section>

              {/* How It Works Section */}
              <section className="py-20 relative">
                <div className="container mx-auto px-4">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">How It Works</h2>
                  <div className="grid md:grid-cols-3 gap-8">
                    <GlassCard className="p-8 hover:translate-y-[-5px] transition-all duration-300">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-4">Fractional Ownership</h3>
                      <p className="text-gray-300">Convert domain names into fungible tokens that can be traded on open markets, unlocking value and liquidity.</p>
                    </GlassCard>
                    <GlassCard className="p-8 hover:translate-y-[-5px] transition-all duration-300">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 mb-6 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-4">Liquidity Pools</h3>
                      <p className="text-gray-300">Automatic market making ensures ongoing price discovery and instant liquidity for domain token traders.</p>
                    </GlassCard>
                    <GlassCard className="p-8 hover:translate-y-[-5px] transition-all duration-300">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 mb-6 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-4">Subdomain Utility</h3>
                      <p className="text-gray-300">Token holders can participate in governance, earning revenue from subdomain registrations and usage.</p>
                    </GlassCard>
                  </div>
                </div>
              </section>

              {/* Featured Tokens Section */}
              <section className="py-20 relative">
                <div className="container mx-auto px-4">
                  <div className="flex justify-between items-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Featured Tokens</h2>
                    <Link href="/tokens">
                      <Button variant="outline" className="border-white/20">
                        View All Tokens
                      </Button>
                    </Link>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {mockTokens.map((token) => (
                      <Link href={`/tokens/${token.id}`} key={token.id}>
                        <GlassCard className="p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                          <h3 className="text-xl font-bold mb-4">{token.name}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-400">Current Price</p>
                              <p className="text-lg font-medium">{token.price}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Total Liquidity</p>
                              <p className="text-lg font-medium">{token.liquidity}</p>
                            </div>
                          </div>
                          <div className="mt-6 pt-4 border-t border-white/10">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-emerald-400">Active</span>
                              <span className="text-sm text-gray-400">→</span>
                            </div>
                          </div>
                        </GlassCard>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            </main>
          </div>
  );
}
