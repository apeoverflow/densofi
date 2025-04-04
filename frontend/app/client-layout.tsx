'use client';

import { useEffect, useState } from 'react';
import { WalletProvider } from '@/components/WalletProvider';

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
  
  // Only render the WalletProvider on the client side
  return <WalletProvider>{children}</WalletProvider>;
}