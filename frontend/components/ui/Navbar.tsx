'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletConnectButton } from '../WalletConnectButton';

type NavLink = {
  label: string;
  href: string;
  showOn: string[];
};

const navLinks: NavLink[] = [
  { label: 'Tokens', href: '/tokens', showOn: ['/', '/walkthrough'] },
  { label: 'All Tokens', href: '/tokens', showOn: ['/tokens/[id]'] },
  { label: 'Walkthrough', href: '/walkthrough', showOn: ['/', '/tokens', '/tokens/[id]'] },
];

export default function Navbar() {
  const pathname = usePathname();
  
  // Handle dynamic routes like /tokens/[id]
  const isTokenDetail = pathname.startsWith('/tokens/') && pathname !== '/tokens';
  const currentPath = isTokenDetail ? '/tokens/[id]' : pathname;

  // Filter links based on current path
  const links = navLinks.filter(link => link.showOn.includes(currentPath));

  return (
    <header className="relative z-10 backdrop-blur-md bg-black/20 border-b border-white/10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-white font-bold text-xl">
          <Link href="/">Denso.fi</Link>
        </div>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <Link 
              key={link.label} 
              href={link.href} 
              className="text-white hover:text-blue-400"
            >
              {link.label}
            </Link>
          ))}
          <WalletConnectButton />
        </div>
      </div>
    </header>
  );
}