'use client';

import { useEffect, useState } from 'react';
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
          </div>
  );
}