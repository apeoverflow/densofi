"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import React from "react";

interface GlassCardProps extends React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className, ...props }: GlassCardProps) {
  return (
    <Card
      className={cn(
        "w-full border border-white/5 relative backdrop-blur-2xl bg-black/20 text-white overflow-hidden rounded-xl",
        className,
      )}
      {...props}
    >
      {/* Glassmorphic Background Layers */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-80" />
        <div className="absolute inset-0 backdrop-blur-[2px] backdrop-saturate-150" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-indigo-500/10 mix-blend-soft-light" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/50 via-black/50 to-black/80" />
      </div>
      {/* Content Container (ensures children are above the background layers) */}
      <div className="relative">{children}</div>
    </Card>
  );
}