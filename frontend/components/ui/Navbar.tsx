'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { WalletConnectButton } from '../WalletConnectButton';

type NavLink = {
  label: string;
  href: string;
  showOn: string[];
};

const navLinks: NavLink[] = [
  { label: 'Tokens', href: '/tokens', showOn: ['/', '/walkthrough', '/mint-nft', '/create-token'] },
  { label: 'All Tokens', href: '/tokens', showOn: ['/tokens/[id]'] },
  // { label: 'Mint NFT', href: '/mint-nft', showOn: ['/', '/tokens', '/tokens/[id]', '/create-token', '/walkthrough'] },
  // { label: 'Create Token', href: '/create-token', showOn: ['/', '/tokens', '/tokens/[id]', '/mint-nft', '/walkthrough'] },
  { label: 'Walkthrough', href: '/walkthrough', showOn: ['/', '/tokens', '/tokens/[id]', '/mint-nft', '/create-token'] },
];

export default function Navbar() {
  const pathname = usePathname();
  
  // Handle dynamic routes like /tokens/[id]
  const isTokenDetail = pathname.startsWith('/tokens/') && pathname !== '/tokens';
  const currentPath = isTokenDetail ? '/tokens/[id]' : pathname;

  // Filter links based on current path
  const links = navLinks.filter(link => link.showOn.includes(currentPath));

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
          <div className="flex items-center py-1 px-9 rounded-lg gap-3 group bg-white text-black text-center px-2/">
            <div className="relative">
              <Image 
                src="/full-flow-logo.webp" 
                alt="Flow Network Logo" 
                width={100} 
                height={32}
                className="mr-8 px-3 py-2 rounded-md opacity-90 bg-white group-hover:opacity-100 transition-opacity duration-300 filter w-[0_0_8px_rgba(34,197,94,0.8)]"
                priority
              />
              {/* Subtle glow behind logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10 rounded-lg blur-md -z-10 group-hover:from-green-400/20 group-hover:to-emerald-400/20 transition-all duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold  tracking-wide  transition-colors duration-300">
                Coming to Flow Network
              </span>
              <span className="text-xs text-gray-400 font-medium  transition-colors duration-300">
                Cross-chain expansion
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
          <div className="text-white font-bold text-xl">
            <Link href="/">Denso.fi</Link>
          </div>
          <div className="flex items-center gap-4">
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
        </div>
      </header>
    </>
  );
}
