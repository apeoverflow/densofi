'use client';

import { useEffect, useState } from 'react';
import { WalletConnectButton } from "@/components/WalletConnectButton";
import Link from "next/link";
import { useAccount } from 'wagmi';
import { ReactNode } from 'react';
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { QueryClient } from '@tanstack/react-query';

// Step component props interface
interface StepProps {
  number: number;
  title: string;
  completed: boolean;
  active: boolean;
  children: ReactNode;
}

// Step component to show completed/pending steps
const Step = ({ number, title, completed, active, children }: StepProps) => {
  return (
    <div className={`mb-8 border ${active ? 'border-blue-500' : completed ? 'border-green-500' : 'border-white/10'} rounded-lg p-6 transition-all ${active ? 'bg-slate-800/70' : 'bg-slate-800/30'}`}>
      <div className="flex items-center mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${completed ? 'bg-green-500' : active ? 'bg-blue-500' : 'bg-slate-700'}`}>
          {completed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-white font-bold">{number}</span>
          )}
        </div>
        <h3 className={`text-xl font-bold ${completed ? 'text-green-400' : active ? 'text-white' : 'text-gray-400'}`}>{title}</h3>
      </div>
      <div className="ml-14">
        {children}
      </div>
    </div>
  );
};

// The walkthrough interface content
const WalkthroughContent = () => {
  const { isConnected } = useAccount();
  
  return (
    <div className="space-y-6">
      <Step 
        number={1} 
        title="Connect Your Wallet" 
        completed={isConnected} 
        active={!isConnected}
      >
        {isConnected ? (
          <p className="text-green-400">✅ Wallet successfully connected!</p>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-300">
              To proceed with the DNSSEC setup, you first need to connect your wallet. 
              This will be used to verify your ownership and sign transactions.
            </p>
            <div className="flex justify-center mt-4">
              <WalletConnectButton />
            </div>
          </div>
        )}
      </Step>
      
      <Step 
        number={2} 
        title="Enable your Domain for ENS" 
        completed={false} 
        active={isConnected}
      >
        {!isConnected ? (
          <p className="text-gray-400">Complete step 1 to proceed</p>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-300">
              Next, you need to enable DNSSEC on your domain registrar and set up a specific TXT record:
            </p>
            
            <ol className="list-decimal pl-5 space-y-3 text-gray-300">
              <li>Log into your domain registrar account (e.g., GoDaddy, Namecheap, Google Domains)</li>
              <li>Navigate to the DNS management section for your domain</li>
              <li>Look for DNSSEC settings and <span className="text-blue-400 font-semibold">enable DNSSEC</span></li>
              <li>Add a new TXT record with the following format:
                <WalletAddressDisplay />
              </li>
              <li>Save your changes and wait for DNS propagation (may take up to 24-48 hours)</li>
            </ol>
            
            <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-md mt-4">
              <h4 className="text-yellow-500 font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Important Note
              </h4>
              <p className="text-gray-300 mt-2">
                The DNSSEC setup process varies between registrars. Some providers may not support DNSSEC or may have different 
                configuration interfaces. If you encounter issues, please consult your registrar's documentation or support.
              </p>
            </div>
          </div>
        )}
      </Step>
      
      <div className="mt-8 text-center">
        <p className="text-gray-400 italic">Complete these steps to proceed to the next phase</p>
      </div>
    </div>
  );
};

// Add this component after the WalkthroughContent component
const WalletAddressDisplay = () => {
  const { isConnected, address } = useWalletConnection();
  return (
    <div className="bg-slate-700 p-3 mt-2 rounded-md font-mono text-sm overflow-auto">
        {isConnected 
        ? `TXT @ _ens a=${address}`
        : "Connect your wallet to see your address here"}
    </div>
  );
};

export default function WalkthroughPage() {
  // Client-side only flag
  const [isClient, setIsClient] = useState(false);
  const [queryClient] = useState(() => new QueryClient());
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Don't render anything during SSR
  if (!isClient) {
    return null;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-6">
            Enable your Domain for ENS
            </h1>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Follow these steps to properly set up DNSSEC for your domain. This process ensures your 
              domain can interact securely with the DNSRegistrar smart contract.
            </p>
          </div>

          <WalkthroughContent />
        </div>
      </main>
    </div>
  );
} 