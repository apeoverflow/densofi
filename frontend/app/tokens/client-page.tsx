'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

export function TokensClient() {
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

            <main className="relative z-10 flex-grow container mx-auto px-4 py-12">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h1 className="text-4xl font-bold text-white mb-6">
                    Domain Tokens
                  </h1>
                  <p className="text-gray-300 max-w-2xl mx-auto">
                    Browse all tokenized domains currently available on the platform.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Placeholder tokens - would be populated from API in real implementation */}
                  {[1, 2, 3, 4, 5, 6].map((id) => (
                    <Link href={`/tokens/${id}`} key={id}>
                      <GlassCard className="p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                        <h3 className="text-xl font-bold mb-4">{id % 2 === 0 ? 'crypto' : 'domain'}{id}.eth</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400">Current Price</p>
                            <p className="text-lg font-medium">{(10 + id * 1.5).toFixed(1)} ETH</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Total Liquidity</p>
                            <p className="text-lg font-medium">{(100 + id * 25).toFixed(1)} ETH</p>
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
            </main>
          </div>
  );
}