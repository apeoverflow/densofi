'use client';

import dynamic from 'next/dynamic';

// Dynamically import the page component with no SSR
const NFTMinterTester = dynamic(() => import('./page'), {
  ssr: false,
});

export default function ClientPage() {
  return <NFTMinterTester />;
}