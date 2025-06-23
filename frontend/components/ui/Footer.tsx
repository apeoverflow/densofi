'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isWalkthroughPage = pathname === '/create-token';

  return (
    <>
        <footer className="relative z-10 backdrop-blur-md bg-black/20 border-t border-white/10 py-10">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">Denso.fi</h3>
                <p className="text-gray-400">Unlocking value and utility for domain names through fractional ownership and tokenization.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-4">Quick Links</h4>
                <div className="space-y-2">
                  <Link href="/tokens" className="block text-gray-400 hover:text-white">Explore Tokens</Link>
                  <Link href="/create-token" className="block text-gray-400 hover:text-white">Create Token</Link>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-white mb-4">Connect</h4>
                <div className="space-y-2">
                  <a href="#" className="block text-gray-400 hover:text-white">Telegram</a>
                  <a href="#" className="block text-gray-400 hover:text-white">Twitter</a>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-white/10 text-center text-gray-500 text-sm">
              <p>© 2025 Denso.fi. All rights reserved.</p>
            </div>
          </div>
        </footer>
    </>
  );
}
