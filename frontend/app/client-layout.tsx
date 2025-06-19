'use client';

import { useEffect, useState } from 'react';
import { WalletProvider } from '@/components/WalletProvider';
import { WalletAuthProvider } from '@/components/WalletAuthProvider';
import Layout from '@/components/Layout';
import MiniKitProvider from '@/components/minikit-provider';

export default function ClientLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  // Client-side only flag to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Return nothing during SSR
  if (!isMounted) {
    return null;
  }
  
  // Only render the WalletProvider and Layout on the client side
  return (
    <MiniKitProvider>
      <WalletProvider>
        <WalletAuthProvider>
          <Layout>
            {children}
          </Layout>
        </WalletAuthProvider>
      </WalletProvider>
    </MiniKitProvider>
  );
}
