'use client';

import { GlassCard } from "./GlassCard";

export function TokenSkeleton() {
  return (
    <GlassCard className="p-6 animate-pulse">
      {/* Title skeleton */}
      <div className="h-6 bg-white/10 rounded mb-4 w-3/4"></div>
      
      {/* Price grid skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="h-4 bg-white/5 rounded mb-2 w-16"></div>
          <div className="h-5 bg-white/10 rounded w-20"></div>
        </div>
        <div>
          <div className="h-4 bg-white/5 rounded mb-2 w-20"></div>
          <div className="h-5 bg-white/10 rounded w-16"></div>
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between">
          <div className="h-4 bg-white/5 rounded w-16"></div>
          <div className="h-4 bg-white/10 rounded w-12"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-white/5 rounded w-20"></div>
          <div className="h-4 bg-white/10 rounded w-16"></div>
        </div>
      </div>

      {/* Status bar skeleton */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-white/10 rounded w-12"></div>
          <div className="h-4 bg-white/5 rounded w-4"></div>
        </div>
      </div>
    </GlassCard>
  );
}

export function TokenGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <TokenSkeleton key={i} />
      ))}
    </div>
  );
}
