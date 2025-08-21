'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AnimatedHeadingGlow } from "@/components/ui/AnimatedHeadingGlow";

export function HeroSection() {
  return (
    <section className="py-20 md:py-32 relative z-10">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div className="max-w-2xl mb-[-60px]">
          <div className="relative flex justify-center">
            {/* Static glow effects - no overflow, no animation */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Soft static glow - contained within text */}
              <div className="absolute w-full h-full bg-gradient-to-br from-blue-500/12 via-purple-500/18 to-teal-500/12 rounded-full blur-2xl opacity-60"></div>
              
              {/* Static energy particles within bounds */}
              <div className="absolute top-4 left-1/4 w-1.5 h-1.5 bg-blue-400/40 rounded-full blur-sm opacity-50"></div>
              <div className="absolute bottom-4 right-1/4 w-1.5 h-1.5 bg-purple-400/40 rounded-full blur-sm opacity-45"></div>
              <div className="absolute top-1/2 left-8 w-1 h-1 bg-teal-400/35 rounded-full blur-sm opacity-40"></div>
              <div className="absolute top-1/2 right-8 w-1 h-1 bg-cyan-400/35 rounded-full blur-sm opacity-40"></div>
            </div>
            
            <AnimatedHeadingGlow 
              text="Tokenize Domain Names" 
              className="text-4xl md:text-6xl font-bold text-center mb-6"
            />
          </div>
          
          <p className="text-lg md:text-xl text-gray-300 mb-8 text-center leading-relaxed">
            Unlock liquidity and value from your domain names through fractional tokenization on the Superchain.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/create-token">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-8 py-3 rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                Create Token
              </Button>
            </Link>
            <Link href="/tokens">
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/20 hover:border-white/30 hover:bg-white/10 text-white font-medium px-8 py-3 rounded-xl hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
              >
                Explore Tokens
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="relative flex justify-center items-center">
          <div className="relative w-80 h-80 md:w-96 md:h-96">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-teal-500/20 rounded-full blur-3xl animate-pulse opacity-70" style={{ animationDuration: '4s' }}></div>
            <div className="absolute inset-4 bg-gradient-to-tr from-indigo-500/15 via-cyan-500/15 to-blue-500/15 rounded-full blur-2xl animate-pulse opacity-60" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
            
            {/* Main dino image */}
            <div className="relative z-10 flex items-center justify-center h-full">
              <Image 
                src="/denso-pixel.png" 
                alt="Denso Dino" 
                width={280} 
                height={280}
                className="opacity-90 hover:opacity-100 transition-opacity duration-300 hover:scale-105 transform transition-transform duration-500" 
              />
            </div>
            
            {/* Floating elements */}
            <div className="absolute top-8 right-8 w-4 h-4 bg-blue-400/60 rounded-full blur-sm animate-bounce opacity-70" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-12 left-12 w-3 h-3 bg-purple-400/60 rounded-full blur-sm animate-bounce opacity-60" style={{ animationDelay: '1.5s' }}></div>
            <div className="absolute top-20 left-8 w-2 h-2 bg-teal-400/60 rounded-full blur-sm animate-bounce opacity-50" style={{ animationDelay: '2s' }}></div>
          </div>
        </div>
      </div>
    </section>
  );
}