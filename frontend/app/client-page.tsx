'use client';

import { useEffect, useState } from 'react';
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";
import { HeroSection } from "@/components/ui/HeroSection";
import { HowItWorksSection } from "@/components/ui/HowItWorksSection";
import { FeaturesSection } from "@/components/ui/FeaturesSection";
import { ComparisonSection } from "@/components/ui/ComparisonSection";
import { TokenListSection } from "@/components/ui/TokenListSection";
import { NewsletterSection } from "@/components/ui/NewsletterSection";

export default function ClientPage() {
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
      <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-slate-900/20 to-black overflow-visible" style={{overflowX: 'hidden', overflowY: 'auto'}}>
        {/* Interactive 3D Background */}
        <InteractiveBackground />
        
        {/* Static gradient overlay for depth and readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-black/60 pointer-events-none z-10"></div>
        
        <main className="relative z-20 flex-grow">
          {/* Hero Section */}
          <HeroSection />
          
          {/* How It Works Section */}
          <HowItWorksSection />
          
          {/* Features Section */}
          <FeaturesSection />
          
          {/* Comparison Section */}
          <ComparisonSection />
          
          {/* Token List Section */}
          <TokenListSection />
          
          {/* Newsletter Section */}
          <NewsletterSection />
        </main>
      </div>
  );
}
