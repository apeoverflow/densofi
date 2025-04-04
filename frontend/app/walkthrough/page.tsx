'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from "@/lib/wagmi";
import '@rainbow-me/rainbowkit/styles.css';
import { sepolia } from 'wagmi/chains';
import { WalletConnectButton } from "@/components/WalletConnectButton";
import Link from "next/link";
import { useAccount, useWalletClient } from 'wagmi';
import { ReactNode, useState as useStateReact } from 'react';
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useCallback } from 'react';

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
          <>
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

            <div className="bg-indigo-900/30 border border-indigo-700/50 p-4 rounded-md mt-6 mb-6">
              <h4 className="text-indigo-400 font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Verify Your DNS Record Setup
              </h4>

              <DnsVerifier />
            </div>
          </>
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

// Add this interface after the imports
interface DnsVerificationResult {
  success: boolean;
  found?: boolean;
  expected?: string;
  actual?: string;
  error?: string;
}

// Add this new component just before the WalletAddressDisplay component
const DnsVerifier = () => {
  const { address } = useWalletConnection();
  const [domain, setDomain] = useStateReact('');
  const [isChecking, setIsChecking] = useStateReact(false);
  const [result, setResult] = useStateReact<DnsVerificationResult | null>(null);
  
  const checkDnsRecord = useCallback(async () => {
    if (!domain) return;
    
    setIsChecking(true);
    setResult(null);
    
    try {
      // In a browser environment, we need to use a DNS lookup service API
      // This is a simulated check using a public DNS API
      const dnsApiUrl = `https://dns.google/resolve?name=_ens.${domain}&type=TXT`;
      
      const response = await fetch(dnsApiUrl);
      const data = await response.json();
      
      // Process the response
      let foundRecord = false;
      let txtValue = null;
      
      if (data.Answer && Array.isArray(data.Answer)) {
        for (const record of data.Answer) {
          // TXT records come with quotes that need to be removed
          const value = record.data.replace(/"/g, '');
          if (value.startsWith('a=')) {
            foundRecord = true;
            txtValue = value;
            break;
          }
        }
      }
      
      const expectedValue = `a=${address}`;
      
      setResult({
        success: foundRecord && txtValue === expectedValue,
        found: foundRecord,
        expected: expectedValue,
        actual: txtValue
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsChecking(false);
    }
  }, [domain, address]);
  
  return (
    <div className="space-y-4 mt-3">
      <p className="text-gray-300">
        Verify your TXT record is set up correctly by entering your domain name below:
      </p>
      
      <div className="flex space-x-2">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="example.com"
          className="flex-grow bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={checkDnsRecord}
          disabled={isChecking || !domain}
          className={`px-4 py-2 rounded ${isChecking || !domain ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {isChecking ? 'Checking...' : 'Verify'}
        </button>
      </div>
      
      {result && (
        <div className={`p-4 rounded ${result.success ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
          {result.success ? (
            <div className="text-green-400 flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-medium">Success! Your TXT record is correctly configured.</p>
                <p className="text-sm mt-1">Found: {result.actual}</p>
              </div>
            </div>
          ) : result.error ? (
            <div className="text-red-400">
              <p className="font-medium">Error checking DNS record: {result.error}</p>
              <p className="text-sm mt-1">Please try again or use an online DNS lookup tool.</p>
            </div>
          ) : result.found ? (
            <div className="text-yellow-400">
              <p className="font-medium">TXT record found but does not match your wallet address:</p>
              <p className="text-sm mt-1">Found: {result.actual}</p>
              <p className="text-sm">Expected: {result.expected}</p>
            </div>
          ) : (
            <div className="text-red-400">
              <p className="font-medium">No ENS TXT record found for {domain}</p>
              <p className="text-sm mt-1">Please make sure you've added the TXT record correctly and DNS has propagated.</p>
            </div>
          )}
        </div>
      )}
      
      <p className="text-gray-300 mt-3">
        Alternatively, you can use these online DNS lookup tools to check your TXT records:
      </p>
      <ul className="list-disc pl-5 space-y-2 text-gray-300">
        <li><a href={`https://mxtoolbox.com/SuperTool.aspx?action=txt%3a_ens.${domain || '[your-domain]'}&run=toolpage`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">MX Toolbox</a></li>
        <li><a href="https://dnschecker.org/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">DNS Checker</a></li>
      </ul>
      
      <div className="mt-3 p-2 border border-indigo-700/30 rounded bg-indigo-900/20">
        <p className="text-indigo-300 text-sm">
          <strong>Tip:</strong> DNS propagation can take time (24-48 hours). If the record doesn't appear after this period, double-check your DNS configuration with your domain registrar.
        </p>
      </div>
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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={sepolia}>
          <div className="flex flex-col min-h-screen">
            <header className="backdrop-blur-md bg-black/20 border-b border-white/10">
              <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <div className="text-white font-bold text-xl">
                  Denso.fi
                </div>
                <WalletConnectButton />
              </div>
            </header>

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

            <footer className="backdrop-blur-md bg-black/20 border-t border-white/10 py-6">
              <div className="container mx-auto px-4 text-center text-white/60 text-sm">
                <p>
                  Built with Next.js, Wagmi, and RainbowKit. Contract at{" "}
                  <Link 
                    href={`https://sepolia.etherscan.io/address/0x7C1bF65D5ec86b526680ec0f195C115c17a90797`}
                    target="_blank"
                    className="text-blue-400 hover:underline"
                  >
                    0x7C1bF65D5ec86b526680ec0f195C115c17a90797
                  </Link>
                </p>
              </div>
            </footer>
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 