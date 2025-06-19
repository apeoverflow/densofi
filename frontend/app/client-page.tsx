'use client';

import { useEffect, useState } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ComingSoonModal } from '@/components/ui/ComingSoonModal';
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";
import { LightningCanvas } from "@/components/ui/LightningCanvas";
import { AnimatedNumberCircle } from "@/components/ui/AnimatedNumberCircle";
import { AnimatedHeadingGlow } from "@/components/ui/AnimatedHeadingGlow";
import { AnimatedDivider } from "@/components/ui/AnimatedDivider";

export default function ClientPage() {
  // Client-side only flag
  const [isClient, setIsClient] = useState(false);
  // Modal state
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  
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
      <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-slate-900/20 to-black overflow-visible" style={{overflowX: 'hidden', overflowY: 'hidden'}}>
        {/* Interactive 3D Background */}
        <InteractiveBackground />
        
        {/* Static gradient overlay for depth and readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-black/60 pointer-events-none z-10"></div>
        
        <main className="relative z-20 flex-grow overflow-visible">
              {/* Unified Background Glow Container for Hero and How It Works */}
              <div className="relative">
                {/* Master animated flowing background glow that spans both sections */}
                <div className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0" style={{ height: '200vh' }}>
                  {/* Hero section area glows */}
                  <div className="absolute top-32 left-1/4 w-88 h-88 bg-gradient-to-r from-blue-900/40 via-indigo-800/50 to-purple-900/45 rounded-full blur-3xl animate-pulse opacity-50" style={{ animationDuration: '6.5s' }}></div>
                  <div className="absolute top-20 right-1/5 w-72 h-72 bg-gradient-to-l from-teal-900/35 via-cyan-800/45 to-blue-900/40 rounded-full blur-2xl animate-pulse opacity-45" style={{ animationDuration: '5.8s', animationDelay: '1s' }}></div>
                  <div className="absolute top-48 left-1/2 transform -translate-x-1/2 w-[400px] h-[300px] bg-gradient-to-br from-purple-900/45 via-blue-800/55 to-indigo-900/50 rounded-full blur-3xl animate-pulse opacity-55" style={{ animationDuration: '7.5s', animationDelay: '2s' }}></div>
                  <div className="absolute top-16 left-10 w-64 h-64 bg-gradient-to-tr from-cyan-900/30 via-blue-800/40 to-teal-900/35 rounded-full blur-2xl animate-pulse opacity-40" style={{ animationDuration: '5.3s', animationDelay: '0.5s' }}></div>
                  <div className="absolute top-60 right-10 w-76 h-76 bg-gradient-to-bl from-indigo-900/35 via-purple-800/45 to-blue-900/40 rounded-full blur-3xl animate-pulse opacity-45" style={{ animationDuration: '6.2s', animationDelay: '3s' }}></div>
                  
                  {/* Transition/bridge glows */}
                  <div className="absolute top-80 left-3/4 w-60 h-60 bg-gradient-to-r from-slate-800/45 via-blue-900/55 to-purple-900/50 rounded-full blur-2xl animate-pulse opacity-50" style={{ animationDuration: '4.8s', animationDelay: '1.5s' }}></div>
                  <div className="absolute top-72 right-1/4 w-56 h-56 bg-gradient-to-l from-teal-900/40 via-slate-800/50 to-cyan-900/45 rounded-full blur-xl animate-pulse opacity-45" style={{ animationDuration: '5.6s', animationDelay: '2.5s' }}></div>
                  <div className="absolute top-88 left-1/8 w-80 h-80 bg-gradient-to-br from-indigo-900/40 via-slate-800/50 to-blue-900/45 rounded-full blur-3xl animate-pulse opacity-50" style={{ animationDuration: '6.8s', animationDelay: '0.8s' }}></div>
                  
                  {/* How It Works area glows - enhanced with more elements */}
                  <div className="absolute top-[45rem] left-1/4 w-96 h-96 bg-gradient-to-r from-slate-900/60 via-slate-800/80 to-slate-900/60 rounded-full blur-3xl animate-pulse opacity-70" style={{ animationDuration: '4s' }}></div>
                  <div className="absolute top-[47rem] right-1/4 w-80 h-80 bg-gradient-to-l from-blue-900/40 via-purple-900/50 to-teal-900/40 rounded-full blur-2xl animate-pulse opacity-50" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
                  <div className="absolute top-[41rem] left-1/2 transform -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-br from-slate-900/50 via-slate-800/70 to-slate-900/50 rounded-full blur-3xl animate-pulse opacity-60" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
                  <div className="absolute top-[53rem] left-10 w-64 h-64 bg-gradient-to-tr from-indigo-900/30 via-slate-800/60 to-purple-900/40 rounded-full blur-2xl animate-pulse opacity-40" style={{ animationDuration: '5s', animationDelay: '0.5s' }}></div>
                  <div className="absolute top-[43rem] right-10 w-72 h-72 bg-gradient-to-bl from-teal-900/35 via-slate-900/65 to-blue-900/45 rounded-full blur-3xl animate-pulse opacity-55" style={{ animationDuration: '7s', animationDelay: '3s' }}></div>
                  <div className="absolute top-[49rem] left-3/4 w-52 h-52 bg-gradient-to-r from-slate-800/50 via-gray-900/70 to-slate-900/55 rounded-full blur-2xl animate-pulse opacity-45" style={{ animationDuration: '5.5s', animationDelay: '1.5s' }}></div>
                  <div className="absolute top-[55rem] right-1/3 w-44 h-44 bg-gradient-to-l from-purple-900/25 via-slate-800/55 to-indigo-900/35 rounded-full blur-xl animate-pulse opacity-35" style={{ animationDuration: '4.5s', animationDelay: '2.5s' }}></div>
                  <div className="absolute top-[45rem] left-1/6 w-88 h-88 bg-gradient-to-br from-slate-900/45 via-blue-900/30 to-slate-800/65 rounded-full blur-3xl animate-pulse opacity-50" style={{ animationDuration: '6.5s', animationDelay: '0.8s' }}></div>
                  <div className="absolute top-[51rem] right-1/6 w-36 h-36 bg-gradient-to-tl from-gray-900/40 via-slate-900/60 to-teal-900/30 rounded-full blur-2xl animate-pulse opacity-40" style={{ animationDuration: '5.8s', animationDelay: '3.2s' }}></div>
                  
                  {/* Additional How It Works glows for more vibrancy */}
                  <div className="absolute top-[72rem] left-1/3 w-68 h-68 bg-gradient-to-r from-blue-800/45 via-indigo-700/55 to-purple-800/50 rounded-full blur-2xl animate-pulse opacity-55" style={{ animationDuration: '5.3s', animationDelay: '1.2s' }}></div>
                  <div className="absolute top-[76rem] right-1/5 w-76 h-76 bg-gradient-to-l from-teal-800/40 via-cyan-700/50 to-blue-800/45 rounded-full blur-3xl animate-pulse opacity-50" style={{ animationDuration: '6.7s', animationDelay: '2.8s' }}></div>
                  <div className="absolute top-[74rem] right-1/2 w-92 h-92 bg-gradient-to-br from-slate-800/35 via-gray-700/45 to-slate-900/40 rounded-full blur-3xl animate-pulse opacity-45" style={{ animationDuration: '7.8s', animationDelay: '0.3s' }}></div>
                  <div className="absolute top-[74rem] left-1/8 w-60 h-60 bg-gradient-to-tr from-purple-700/40 via-violet-800/35 to-indigo-800/30 rounded-full blur-2xl animate-pulse opacity-40" style={{ animationDuration: '4.9s', animationDelay: '3.5s' }}></div>
                  <div className="absolute top-[76rem] right-1/8 w-52 h-52 bg-gradient-to-bl from-cyan-700/35 via-teal-800/40 to-blue-800/35 rounded-full blur-xl animate-pulse opacity-35" style={{ animationDuration: '6.1s', animationDelay: '1.8s' }}></div>
                  <div className="absolute top-[72rem] left-2/3 w-48 h-48 bg-gradient-to-tl from-slate-800/30 via-gray-700/40 to-slate-900/35 rounded-full blur-2xl animate-pulse opacity-40" style={{ animationDuration: '5.7s', animationDelay: '2.3s' }}></div>
                  <div className="absolute top-[78rem] right-2/3 w-64 h-64 bg-gradient-to-r from-indigo-700/40 via-blue-700/50 to-teal-700/45 rounded-full blur-2xl animate-pulse opacity-45" style={{ animationDuration: '6.3s', animationDelay: '1.7s' }}></div>
                  <div className="absolute top-[70rem] left-1/4 w-56 h-56 bg-gradient-to-l from-slate-700/45 via-gray-700/50 to-slate-800/40 rounded-full blur-xl animate-pulse opacity-50" style={{ animationDuration: '5.1s', animationDelay: '2.9s' }}></div>
                  <div className="absolute top-[76rem] left-3/5 w-72 h-72 bg-gradient-to-br from-blue-700/35 via-indigo-700/45 to-purple-700/40 rounded-full blur-3xl animate-pulse opacity-45" style={{ animationDuration: '7.5s', animationDelay: '0.7s' }}></div>
                  <div className="absolute top-[74rem] right-3/5 w-44 h-44 bg-gradient-to-tr from-teal-700/30 via-cyan-700/35 to-blue-700/30 rounded-full blur-xl animate-pulse opacity-35" style={{ animationDuration: '4.7s', animationDelay: '3.1s' }}></div>
                </div>
                
                {/* Hero Section */}
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
                        
                        {/* Static rings within bounds */}
                        <div className="absolute inset-6 border border-blue-400/10 rounded-full opacity-25"></div>
                        <div className="absolute inset-12 border border-purple-400/8 rounded-full opacity-20"></div>
                      </div>
                      
                      <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight relative overflow-visible z-10 text-center md:text-left">
                        <span className="relative z-10">Unlocking price discovery and liquidity for domain names</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-teal-400 bg-clip-text text-transparent blur-sm opacity-30"></div>
                        <AnimatedHeadingGlow 
                          color="#60A5FA" 
                          intensity={0.15} 
                          speed={0.8} 
                          distortionAmount={0.5}
                          size={0.7}
                          randomSeed={1}
                        />
                      </h1>
                    </div>
                    <div className="text-lg text-gray-300 space-y-4 mb-8 text-center md:text-left">
                      <p>Fractional tokenization of domain names with launchpad mechanics and liquidity pools.</p>
                      <p>Enabling NFT to Cross Chain Superchain ERC20 support and subdomain registration for utility.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                      <Link href="/walkthrough" className="flex-1 sm:flex-none">
                        <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:brightness-110 hover:shadow-lg hover:shadow-blue-500/25 transition-all text-base font-semibold px-8 py-4">
                          🚀 Get Started
                        </Button>
                      </Link>
                      <Link href="/dino-game" className="flex-1 sm:flex-none">
                        <Button 
                          size="lg" 
                          className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 hover:shadow-lg hover:shadow-green-500/25 transition-all text-base font-semibold px-8 py-4"
                        >
                          🎮 Play Dino Game
                        </Button>
                      </Link>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="w-full sm:w-auto border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-lg hover:shadow-white/10 transition-all text-base font-semibold px-8 py-4"
                        onClick={() => setIsTokenModalOpen(true)}
                      >
                        💎 View Launched Tokens
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-center hidden md:flex">
                    <div className="relative w-full max-w-sm md:w-[400px] md:h-[500px] group">
                      <Image 
                        src="/dino-beefed-up.png" 
                        alt="Dino mascot" 
                        width={400} 
                        height={400}
                        style={{opacity: 0.92}}
                        className="object-contain w-full h-auto drop-shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse opacity-50" style={{ animationDuration: '4s' }}></div>
                    </div>
                  </div>
                </div>

                {/* Desktop-only chevron */}
                <div className="hidden md:flex justify-center mt-">
                  <button 
                    onClick={() => {
                      const target = document.getElementById('how-it-works');
                      if (target) {
                        const navbarHeight = 0; // Approximate height of sticky navbar
                        const targetPosition = target.offsetTop - navbarHeight;
                        window.scrollTo({
                          top: targetPosition,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className="opacity-60 w-14 h-14 rounded-full backdrop-blur-xl flex items-center justify-center border border-white/10 hover:border-white/20 hover:opacity-80 transition-all duration-300 shadow-lg shadow-blue-500/5 hover:shadow-blue-500/15 group"
                    aria-label="Scroll down to How It Works"
                    style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/70 group-hover:text-white/90 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </section>
              {/* Animated Divider */}
              <AnimatedDivider />

                {/* How It Works Section */}
                <section id="how-it-works" className="relative z-10">
                  <div className="container mx-auto px-4 h-full">
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-center relative z-10 overflow-visible min-h-[120px] flex items-center justify-center">
                    <span className="relative z-10">How It Works</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-teal-400 bg-clip-text text-transparent blur-md opacity-70"></div>
                  </h2>
                  <p className="text-lg md:text-xl text-gray-300 text-center mb-16 max-w-3xl mx-auto leading-relaxed relative z-10">
                    Transform your domains into liquid DeFi assets in three simple steps
                  </p>

                  
                  {/* Three Steps */}
                  <div className="relative max-w-6xl mx-auto mb-20">
                    {/* Connection Lines */}
                    <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-px">
                      <div className="flex justify-between items-center h-full">
                        <div className="w-1/3 h-px bg-gradient-to-r from-blue-400/30 to-teal-400/30 relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-teal-400/10 blur-sm"></div>
                        </div>
                        <div className="w-1/3 h-px bg-gradient-to-r from-teal-400/30 to-purple-400/30 relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-400/10 to-purple-400/10 blur-sm"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-12">
                      {/* Step 1 */}
                      <div className="relative group">
                        <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2">
                          {/* Background glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          {/* Step number */}
                          <div className="relative mb-6 flex justify-center">
                            <div className="relative">
                              <AnimatedNumberCircle number="1" color="#3B82F6" size={1} randomSeed={0.7} />
                              <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r from-blue-500/15 to-indigo-500/15 rounded-full blur-xl -z-10 group-hover:from-blue-500/25 group-hover:to-indigo-500/25 transition-all duration-500"></div>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="relative z-10 text-center">
                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                              Verify & Mint
                            </h3>
                            <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                              Use ENS or DNS TXT records to prove ownership, then mint both NFT representation and fractional ERC20 tokens of your domain.
                            </p>
                          </div>
                          
                          {/* Corner accent */}
                          <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400/30 rounded-full group-hover:bg-blue-400/60 transition-colors duration-300"></div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="relative group">
                        <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 hover:border-teal-500/30 transition-all duration-500 backdrop-blur-sm hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-2">
                          {/* Background glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          {/* Step number */}
                          <div className="relative mb-6 flex justify-center">
                            <div className="relative">
                              <AnimatedNumberCircle number="2" color="#14B8A6" size={1} randomSeed={0.3} />
                              <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r from-teal-500/15 to-emerald-500/15 rounded-full blur-xl -z-10 group-hover:from-teal-500/25 group-hover:to-emerald-500/25 transition-all duration-500"></div>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="relative z-10 text-center">
                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-teal-300 transition-colors duration-300">
                              Launch & Fund
                            </h3>
                            <div className="w-12 h-0.5 bg-gradient-to-r from-teal-400 to-emerald-400 mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                              Create ERC20 tokens and automatically establish liquidity pools with initial funding and pricing discovery mechanisms.
                            </p>
                          </div>
                          
                          {/* Corner accent */}
                          <div className="absolute top-4 right-4 w-2 h-2 bg-teal-400/30 rounded-full group-hover:bg-teal-400/60 transition-colors duration-300"></div>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="relative group">
                        <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-500 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-2">
                          {/* Background glow */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          
                          {/* Step number */}
                          <div className="relative mb-6 flex justify-center">
                            <div className="relative">
                              <AnimatedNumberCircle number="3" color="#8B5CF6" size={1} randomSeed={0.9} />
                              <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-xl -z-10 group-hover:from-purple-500/25 group-hover:to-pink-500/25 transition-all duration-500"></div>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="relative z-10 text-center">
                            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                              Trade, Borrow, Earn
                            </h3>
                            <div className="w-12 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                              Unlock instant liquidity, participate in lending protocols, and monetize through subdomain revenue streams.
                            </p>
                          </div>
                          
                          {/* Corner accent */}
                          <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400/30 rounded-full group-hover:bg-purple-400/60 transition-colors duration-300"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  </div>
                </section>
              </div>

              <AnimatedDivider />
              
              {/* Unified Background Glow Container for Both Sections */}
              <div className="relative">
                {/* Master animated flowing background glow that spans both sections */}
                <div className="absolute inset-0 w-full h-full overflow-visible pointer-events-none z-0" style={{ height: '200vh' }}>
                  {/* Why Choose Densofi area glows */}
                  <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-900/45 via-violet-800/55 to-indigo-900/50 rounded-full blur-3xl animate-pulse opacity-55" style={{ animationDuration: '6s' }}></div>
                  <div className="absolute top-10 right-1/5 w-72 h-72 bg-gradient-to-l from-emerald-900/40 via-teal-800/50 to-cyan-900/45 rounded-full blur-2xl animate-pulse opacity-50" style={{ animationDuration: '5.5s', animationDelay: '1s' }}></div>
                  <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-[450px] h-[350px] bg-gradient-to-br from-blue-900/50 via-indigo-800/60 to-purple-900/50 rounded-full blur-3xl animate-pulse opacity-60" style={{ animationDuration: '7s', animationDelay: '2s' }}></div>
                  <div className="absolute top-10 left-10 w-60 h-60 bg-gradient-to-tr from-rose-900/35 via-pink-800/45 to-purple-900/40 rounded-full blur-2xl animate-pulse opacity-45" style={{ animationDuration: '5.2s', animationDelay: '0.5s' }}></div>
                  <div className="absolute top-80 right-10 w-80 h-80 bg-gradient-to-bl from-teal-900/40 via-emerald-800/50 to-green-900/45 rounded-full blur-3xl animate-pulse opacity-50" style={{ animationDuration: '6.8s', animationDelay: '3s' }}></div>
                  
                  {/* Transition/bridge glows */}
                  <div className="absolute top-96 left-3/4 w-64 h-64 bg-gradient-to-r from-cyan-800/40 via-blue-900/50 to-indigo-900/45 rounded-full blur-2xl animate-pulse opacity-45" style={{ animationDuration: '4.8s', animationDelay: '1.5s' }}></div>
                  <div className="absolute top-80 right-1/4 w-52 h-52 bg-gradient-to-l from-violet-900/30 via-purple-800/45 to-fuchsia-900/35 rounded-full blur-xl animate-pulse opacity-40" style={{ animationDuration: '5.6s', animationDelay: '2.5s' }}></div>
                  <div className="absolute top-72 left-1/8 w-88 h-88 bg-gradient-to-br from-indigo-900/45 via-blue-800/55 to-cyan-900/50 rounded-full blur-3xl animate-pulse opacity-55" style={{ animationDuration: '6.4s', animationDelay: '0.8s' }}></div>
                  
                  {/* Featured Tokens area glows - enhanced with more elements */}
                  <div className="absolute top-[40rem] left-1/5 w-96 h-96 bg-gradient-to-r from-amber-900/50 via-yellow-800/60 to-orange-900/50 rounded-full blur-3xl animate-pulse opacity-60" style={{ animationDuration: '5s' }}></div>
                  <div className="absolute top-[36rem] right-1/4 w-80 h-80 bg-gradient-to-l from-blue-900/40 via-cyan-900/50 to-blue-900/40 rounded-full blur-2xl animate-pulse opacity-50" style={{ animationDuration: '7s', animationDelay: '1s' }}></div>
                  <div className="absolute top-[44rem] left-1/2 transform -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-br from-emerald-900/45 via-teal-800/55 to-green-900/45 rounded-full blur-3xl animate-pulse opacity-55" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
                  <div className="absolute top-[38rem] left-10 w-72 h-72 bg-gradient-to-tr from-purple-900/35 via-violet-800/50 to-indigo-900/40 rounded-full blur-2xl animate-pulse opacity-45" style={{ animationDuration: '5.5s', animationDelay: '0.5s' }}></div>
                  <div className="absolute top-[48rem] right-10 w-64 h-64 bg-gradient-to-bl from-pink-900/30 via-rose-800/45 to-red-900/35 rounded-full blur-3xl animate-pulse opacity-40" style={{ animationDuration: '6.5s', animationDelay: '3s' }}></div>
                  <div className="absolute top-[42rem] left-3/4 w-56 h-56 bg-gradient-to-r from-orange-800/40 via-amber-900/55 to-yellow-900/45 rounded-full blur-2xl animate-pulse opacity-50" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}></div>
                  <div className="absolute top-[46rem] right-1/3 w-48 h-48 bg-gradient-to-l from-cyan-900/35 via-blue-800/50 to-sky-900/40 rounded-full blur-xl animate-pulse opacity-45" style={{ animationDuration: '5.8s', animationDelay: '2.5s' }}></div>
                  <div className="absolute top-[40rem] left-1/6 w-84 h-84 bg-gradient-to-br from-emerald-900/40 via-teal-800/55 to-cyan-900/45 rounded-full blur-3xl animate-pulse opacity-50" style={{ animationDuration: '7.2s', animationDelay: '0.8s' }}></div>
                  
                  {/* Additional Featured Tokens glows for more vibrancy - positioned at bottom of Featured Tokens */}
                  <div className="absolute top-[92rem] left-1/3 w-64 h-64 bg-gradient-to-r from-yellow-800/45 via-yellow-700/55 to-amber-800/50 rounded-full blur-2xl animate-pulse opacity-55" style={{ animationDuration: '5.3s', animationDelay: '1.2s' }}></div>
                  <div className="absolute top-[98rem] right-1/5 w-72 h-72 bg-gradient-to-l from-emerald-800/40 via-green-700/50 to-teal-800/45 rounded-full blur-3xl animate-pulse opacity-50" style={{ animationDuration: '6.7s', animationDelay: '2.8s' }}></div>
                  <div className="absolute top-[84rem] right-1/2 w-80 h-80 bg-gradient-to-br from-blue-800/35 via-indigo-700/45 to-purple-800/40 rounded-full blur-3xl animate-pulse opacity-45" style={{ animationDuration: '7.8s', animationDelay: '0.3s' }}></div>
                  <div className="absolute top-[90rem] left-1/8 w-60 h-60 bg-gradient-to-tr from-orange-700/40 via-red-800/35 to-pink-800/30 rounded-full blur-2xl animate-pulse opacity-40" style={{ animationDuration: '4.9s', animationDelay: '3.5s' }}></div>
                  <div className="absolute top-[93rem] right-1/8 w-52 h-52 bg-gradient-to-bl from-cyan-700/35 via-sky-800/40 to-blue-800/35 rounded-full blur-xl animate-pulse opacity-35" style={{ animationDuration: '6.1s', animationDelay: '1.8s' }}></div>
                  <div className="absolute top-[96rem] left-3/5 w-72 h-72 bg-gradient-to-br from-indigo-700/35 via-blue-700/45 to-cyan-700/40 rounded-full blur-3xl animate-pulse opacity-45" style={{ animationDuration: '7.5s', animationDelay: '0.7s' }}></div>
                  <div className="absolute top-[91rem] right-3/5 w-48 h-48 bg-gradient-to-tr from-rose-700/30 via-pink-700/35 to-red-700/30 rounded-full blur-xl animate-pulse opacity-35" style={{ animationDuration: '4.7s', animationDelay: '3.1s' }}></div>
                </div>
                
                {/* Why Choose Densofi Section */}
                <section className="relative z-10">
                  <div className="container mx-auto px-4">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white  text-center relative z-10 overflow-visible min-h-[200px] flex items-center justify-center">
                    <span className="relative z-10">Why Choose Densofi</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-teal-400 bg-clip-text text-transparent blur-md opacity-70"></div>
                    <AnimatedHeadingGlow 
                      color="#8B5CF6" 
                      intensity={0.25} 
                      speed={0.9} 
                      distortionAmount={0.7}
                      size={0.6}
                      randomSeed={0.8}
                    />
                  </h2>
                  <p className="text-lg text-gray-300 text-center mt-[-20px] mb-12">See how we compare to the competition with superior DeFi integration</p>
                  <GlassCard className="p-6 relative overflow-hidden">
                    <div className="absolute inset-0 z-0 opacity-30">
                      <LightningCanvas />
                    </div>
                    <div className="overflow-x-auto relative z-10">
                      <table className="w-full text-left table-auto border-collapse">
                        <thead>
                          <tr className="bg-white/5">
                            <th className="p-2 text-sm md:p-4 md:text-base text-white font-semibold rounded-tl-lg">Feature</th>
                            <th className="p-2 text-sm md:p-4 md:text-base text-white font-semibold">3DNS</th>
                            <th className="p-2 text-sm md:p-4 md:text-base text-white font-semibold">NameFi</th>
                            <th className="p-2 text-sm md:p-4 md:text-base text-white font-semibold rounded-tr-lg">Densofi</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-white/5 transition-colors duration-300">
                            <td className="p-2 text-sm md:p-4 md:text-base text-gray-300">NFT minting</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]">&#10003;</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]">&#10003;</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]">&#10003;</td>
                          </tr>
                          <tr className="border-t border-white/5 transition-colors duration-300">
                            <td className="p-2 text-sm md:p-4 md:text-base text-gray-300">ERC20 fractional tokens</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">&#10006;</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">&#10006;</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]">&#10003;</td>
                          </tr>
                          <tr className="border-t border-white/5  transition-colors duration-300">
                            <td className="p-2 text-sm md:p-4 md:text-base text-gray-300">Cross-chain support</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">&#10006;</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]">Partial</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]">&#10003;</td>
                          </tr>
                          <tr className="border-t border-white/5  transition-colors duration-300">
                            <td className="p-2 text-sm md:p-4 md:text-base text-gray-300">DeFi integration</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">&#10006;</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]">&#10003;</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]">&#10003;</td>
                          </tr>
                          <tr className="border-t border-white/5  transition-colors duration-300">
                            <td className="p-2 text-sm md:p-4 md:text-base text-gray-300">Subdomain monetization</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">&#10006;</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.7)]">Limited</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]">&#10003;</td>
                          </tr>
                          <tr className="border-t border-white/5  transition-colors duration-300">
                            <td className="p-2 text-sm md:p-4 md:text-base text-gray-300">Price discovery via LP</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">&#10006;</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">&#10006;</td>
                            <td className="p-2 text-sm md:p-4 md:text-base text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.7)]">&#10003;</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </GlassCard>
                </div>
                <div className="container mx-auto px-4 mt-16">
                   {/* Feature Cards */}
                  <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Fractional Ownership */}
                    <div className="relative group">
                      <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 backdrop-blur-sm hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Icon */}
                        <div className="relative mb-6 flex justify-center">
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                            </svg>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl blur-xl -z-10 group-hover:from-blue-500/30 group-hover:to-indigo-500/30 transition-all duration-300"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="relative z-10 text-center">
                          <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                            Fractional Ownership
                          </h3>
                          <div className="w-12 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                            Convert domain names into fungible tokens that can be traded on open markets, unlocking value and liquidity.
                          </p>
                        </div>
                        
                        {/* Corner accent */}
                        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400/30 rounded-full group-hover:bg-blue-400/60 transition-colors duration-300"></div>
                      </div>
                    </div>

                    {/* Liquidity Pools */}
                    <div className="relative group">
                      <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 hover:border-teal-500/30 transition-all duration-500 backdrop-blur-sm hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-2">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Icon */}
                        <div className="relative mb-6 flex justify-center">
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-teal-500/40 transition-all duration-300 group-hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 to-emerald-500/20 rounded-2xl blur-xl -z-10 group-hover:from-teal-500/30 group-hover:to-emerald-500/30 transition-all duration-300"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="relative z-10 text-center">
                          <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-teal-300 transition-colors duration-300">
                            Liquidity Pools
                          </h3>
                          <div className="w-12 h-0.5 bg-gradient-to-r from-teal-400 to-emerald-400 mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                            Automatic market making ensures ongoing price discovery and instant liquidity for domain token traders.
                          </p>
                        </div>
                        
                        {/* Corner accent */}
                        <div className="absolute top-4 right-4 w-2 h-2 bg-teal-400/30 rounded-full group-hover:bg-teal-400/60 transition-colors duration-300"></div>
                      </div>
                    </div>

                    {/* Subdomain Utility */}
                    <div className="relative group">
                      <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-500 backdrop-blur-sm hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-2">
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Icon */}
                        <div className="relative mb-6 flex justify-center">
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center group-hover:shadow-lg group-hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-110">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl -z-10 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="relative z-10 text-center">
                          <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-purple-300 transition-colors duration-300">
                            Subdomain Utility
                          </h3>
                          <div className="w-12 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                            Token holders can participate in governance, earning revenue from subdomain registrations and usage.
                          </p>
                        </div>
                        
                        {/* Corner accent */}
                        <div className="absolute top-4 right-4 w-2 h-2 bg-purple-400/30 rounded-full group-hover:bg-purple-400/60 transition-colors duration-300"></div>
                      </div>
                    </div>
                  </div>
                </div>

                </section>

                <AnimatedDivider />

                {/* Featured Tokens Section */}
                <section className="relative z-10">
                  <div className="container mx-auto px-4">
                  <div className="flex justify-between items-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white relative overflow-visible min-h-[120px] flex items-center justify-center">
                      <span className="relative z-10">Featured Tokens</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-teal-400 bg-clip-text text-transparent blur-sm opacity-30"></div>
                      <AnimatedHeadingGlow 
                        color="#F59E0B" 
                        intensity={0.18} 
                        speed={1.5} 
                        distortionAmount={0.35}
                        size={0.4}
                        randomSeed={0.3}
                      />
                    </h2>
                    <Button 
                      variant="outline" 
                      className="border-white/20 hover:border-white/30 hover:bg-white/10 hover:shadow-lg hover:shadow-white/10 transition-all"
                      onClick={() => setIsTokenModalOpen(true)}
                    >
                      View All Tokens
                    </Button>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {mockTokens.map((token) => (
                      <Link href={`/tokens/${token.id}`} key={token.id}>
                        <GlassCard className="p-6 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                          {/* Card glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-teal-500/5 opacity-0 transition-opacity duration-300 pointer-events-none"></div>
                          
                          <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-4 group-hover:text-blue-300 transition-colors duration-300">{token.name}</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-400">Current Price</p>
                                <p className="text-lg font-medium group-hover:text-white transition-colors duration-300">{token.price}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-400">Total Liquidity</p>
                                <p className="text-lg font-medium group-hover:text-white transition-colors duration-300">{token.liquidity}</p>
                              </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-white/10 group-hover:border-white/20 transition-colors duration-300">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">Active</span>
                                <span className="text-sm text-gray-400 group-hover:text-white transition-all duration-300 transform group-hover:translate-x-1">→</span>
                              </div>
                            </div>
                          </div>
                        </GlassCard>
                      </Link>
                    ))}
                  </div>


                </div>
                
                {/* Coming Soon Modal */}
                <ComingSoonModal 
                  isOpen={isTokenModalOpen} 
                  onClose={() => setIsTokenModalOpen(false)}
                  title="Token Feature Coming Soon"
                  description="We're working hard to bring you the token functionality. It will be available soon!"
                />
                </section>
              </div>
            </main>
          </div>
  );
}
