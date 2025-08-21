'use client';

import Link from 'next/link';
import Image from 'next/image';
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
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-white">Densofi</h3>
                  <Image 
                    src="/denso-pixel.png" 
                    alt="Denso Dino" 
                    width={42} 
                    height={42}
                    className="opacity-90 hover:opacity-100 transition-opacity duration-200 pb-4" 
                  />
                </div>
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
                  <a href="https://t.me/+H5Z6_hPdJao5MWY5" className="block text-gray-400 hover:text-white transition-colors">Telegram</a>
                  <a href="https://twitter.com/densofinance" className="block text-gray-400 hover:text-white transition-colors">Twitter</a>
                  <a href="https://discord.gg/juhHmAw4" className="block text-gray-400 hover:text-white transition-colors">Discord</a>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t border-white/10 text-center text-gray-500 text-sm">
              <p>© 2025 Densofi. All rights reserved.</p>
            </div>
          </div>
        </footer>
    </>
  );
}
