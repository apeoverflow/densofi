'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { WalletConnectButton } from '../WalletConnectButton';

type NavLink = {
  label: string;
  href: string;
  showOn: string[];
};

const navLinks: NavLink[] = [
  { label: 'Tokens', href: '/tokens', showOn: ['/', '/create-token', '/dino-game'] },
  { label: 'All Tokens', href: '/tokens', showOn: ['/tokens/[id]'] },
  { label: 'Dino Game', href: '/dino-game', showOn: ['/', '/tokens', '/tokens/[id]', '/create-token', '/dino-game'] },
  { label: 'Create Token', href: '/create-token', showOn: ['/', '/tokens', '/tokens/[id]', '/dino-game'] },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Handle dynamic routes like /tokens/[id]
  const isTokenDetail = pathname.startsWith('/tokens/') && pathname !== '/tokens';
  const currentPath = isTokenDetail ? '/tokens/[id]' : pathname;

  // Filter links based on current path
  const links = navLinks.filter(link => link.showOn.includes(currentPath));

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Coming to Flow Banner - Non-sticky, scrolls away */}
      <div className="relative z-10 backdrop-blur-xl bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/80 border-b border-white/10">
        {/* Animated background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-32 h-8 bg-gradient-to-r from-blue-500/20 to-teal-500/20 rounded-full blur-xl animate-pulse opacity-60" style={{ animationDuration: '4s' }}></div>
          <div className="absolute top-0 right-1/4 w-24 h-6 bg-gradient-to-l from-purple-500/15 to-blue-500/15 rounded-full blur-lg animate-pulse opacity-50" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-2.5 flex items-center justify-center">
          <div className="flex items-center mt-[-15px] py-1 px-3 md:px-9 rounded-lg gap-2 md:gap-3 group bg-white text-black text-center">
            <div className="relative">
              <Image 
                src="/full-flow-logo.webp" 
                alt="Flow Network Logo" 
                width={60} 
                height={32}
                className=" mr-2  py-0 rounded-md opacity-90 bg-white group-hover:opacity-100 transition-opacity duration-300"
                priority
              />
              {/* Subtle glow behind logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-lg blur-md -z-10 group-hover:from-green-400/20 group-hover:to-emerald-400/20 transition-all duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-semibold tracking-wide transition-colors duration-300">
                Coming to Flow Network
              </span>
            </div>
          </div>
          
          {/* Subtle shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse opacity-50 pointer-events-none" style={{ animationDuration: '3s' }}></div>
        </div>
        
        {/* Bottom border glow */}
        <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
      </div>

      {/* Main Navbar - Sticky */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10 shadow-lg shadow-black/20">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo */}
          <div className="text-white font-bold text-xl">
            <Link href="/" onClick={closeMobileMenu}>Densofi</Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {links.map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                className="text-white hover:text-blue-400 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
            <WalletConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            <div className="scale-75">
              <WalletConnectButton />
            </div>
            <button
              onClick={toggleMobileMenu}
              className="text-white hover:text-blue-400 transition-colors duration-200"
              aria-label="Toggle mobile menu"
            >
              <svg 
                className="w-6 h-6" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                ) : (
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 6h16M4 12h16M4 18h16" 
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full backdrop-blur-md bg-black/90 border-b border-white/10 shadow-lg">
            <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {links.map((link) => (
                <Link 
                  key={link.label} 
                  href={link.href} 
                  className="text-white hover:text-blue-400 transition-colors duration-200 py-2 border-b border-white/10 last:border-b-0"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40" 
            onClick={closeMobileMenu}
          />
        )}
      </header>
    </>
  );
}
