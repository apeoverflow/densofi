'use client';

import { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ComingSoonModal } from '@/components/ui/ComingSoonModal';
import { AnimatedDivider } from "@/components/ui/AnimatedDivider";

export function TokenListSection() {
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  
  // Mock token data
  const mockTokens = [
    { id: '1', name: 'crypto.eth', price: '15.3 ETH', liquidity: '256.2 ETH' },
    { id: '2', name: 'defi.eth', price: '10.7 ETH', liquidity: '180.5 ETH' },
    { id: '3', name: 'nft.eth', price: '12.8 ETH', liquidity: '204.1 ETH' },
  ];

  return (
    <section className="py-16 relative z-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Featured <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Domain Tokens</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Explore tokenized domains with real-time pricing and liquidity information
          </p>
        </div>

        <AnimatedDivider />

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
          {mockTokens.map((token) => (
            <Link key={token.id} href={`/tokens/${token.id}`}>
              <GlassCard className="p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                    {token.name}
                  </h3>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Price</span>
                    <span className="text-white font-medium">{token.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Liquidity</span>
                    <span className="text-white font-medium">{token.liquidity}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-400">+12.5%</span>
                    <span className="text-gray-400">24h</span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href={`/tokens`}>
            <Button 
              variant="outline" 
              className="border-white/20 hover:border-white/30 hover:bg-white/10 hover:shadow-lg hover:shadow-white/10 transition-all"
              onClick={() => setIsTokenModalOpen(true)}
            >
              View All Tokens
            </Button>
          </Link>
        </div>
        
        {/* Coming Soon Modal */}
        <ComingSoonModal 
          isOpen={isTokenModalOpen} 
          onClose={() => setIsTokenModalOpen(false)}
          title="Token Feature Coming Soon"
          description="We're working hard to bring you the token functionality. It will be available soon!"
        />
      </div>
    </section>
  );
}