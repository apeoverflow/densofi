'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { ComingSoonModal } from "@/components/ui/ComingSoonModal";
import { useTokens } from "@/hooks/useTokens";
import { TokenGridSkeleton } from "@/components/ui/TokenSkeleton";
import { IconArrowUp, IconArrowDown, IconLoader, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

export function TokensClient() {
  // Client-side only flag
  const [isClient, setIsClient] = useState(false);
  // Modal state - only show for empty state now
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch tokens from database with pagination (FAST!)
  const { tokens, loading, error, pagination, loadTime, loadPage } = useTokens(currentPage, 12);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Show coming soon modal if no tokens are available and not loading
    if (isClient && !loading && tokens.length === 0 && !error) {
      setIsComingSoonModalOpen(true);
    }
  }, [isClient, loading, tokens.length, error]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadPage(newPage);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
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
                  {/* Performance indicator */}
                  {/* {loadTime && !loading && (
                    <p className="text-xs text-gray-500 mt-2">
                      ⚡ Loaded in {loadTime}
                      {pagination && ` • Page ${pagination.page} of ${pagination.totalPages} • ${pagination.total} total tokens`}
                    </p>
                  )} */}
                </div>

                {/* Fast Loading with Skeleton */}
                {loading && (
                  <TokenGridSkeleton count={12} />
                )}

                {/* Error State */}
                {error && (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <p className="text-red-400 mb-4">Failed to load tokens</p>
                      <p className="text-gray-400 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                {/* Tokens Grid */}
                {!loading && !error && tokens.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tokens.map((token) => (
                      <Link href={`/tokens/${encodeURIComponent(token.name)}`} key={token.id}>
                        <GlassCard className="p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                          <h3 className="text-xl font-bold mb-4">{token.name}</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-400">Current Price</p>
                              <p className="text-lg font-medium">{token.currentPrice.toFixed(6)} ETH</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-400">Total Liquidity</p>
                              <p className="text-lg font-medium">{token.totalLiquidity.toFixed(1)} ETH</p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-400">24h Change</p>
                              <div className={`flex items-center ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {token.change24h >= 0 ? <IconArrowUp size={16} /> : <IconArrowDown size={16} />}
                                <span className="ml-1 text-sm font-medium">
                                  {Math.abs(token.change24h).toFixed(2)}%
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-sm text-gray-400">24h Volume</p>
                              <p className="text-sm text-white">{token.volume24h.toFixed(1)} ETH</p>
                            </div>
                          </div>
                          <div className="mt-6 pt-4 border-t border-white/10">
                            <div className="flex justify-between items-center">
                              <span className={`text-sm ${token.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                                {token.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className="text-sm text-gray-400">→</span>
                            </div>
                          </div>
                        </GlassCard>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {!loading && !error && tokens.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-300 text-lg mb-4">No domain tokens found</p>
                    <p className="text-gray-400">Register a domain to create your first token!</p>
                  </div>
                )}

                {/* Pagination Controls */}
                {!loading && !error && pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center mt-12 space-x-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        pagination.hasPrev
                          ? 'bg-white/10 hover:bg-white/20 text-white'
                          : 'bg-white/5 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <IconChevronLeft size={16} />
                      <span>Previous</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                        const pageNum = i + 1;
                        const isActive = pageNum === currentPage;
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {pagination.totalPages > 5 && (
                        <>
                          <span className="text-gray-500">...</span>
                          <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              currentPage === pagination.totalPages
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-gray-300'
                            }`}
                          >
                            {pagination.totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        pagination.hasNext
                          ? 'bg-white/10 hover:bg-white/20 text-white'
                          : 'bg-white/5 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span>Next</span>
                      <IconChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </main>
            
            {/* Coming Soon Modal - only show when no tokens */}
            <ComingSoonModal 
              isOpen={isComingSoonModalOpen} 
              onClose={() => setIsComingSoonModalOpen(false)}
              title="No Domain Tokens Yet"
              description="Domain tokens will appear here once domains are registered and tokenized. Register your first domain to get started!"
            />
          </div>
  );
}