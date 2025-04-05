'use client';

import { useEffect, useState } from 'react';

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import '@rainbow-me/rainbowkit/styles.css';
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useAccount, useWalletClient } from 'wagmi';
import { ReactNode } from 'react';
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { useNFTMinterContract } from "@/hooks/useNFTMinterContract";
import { useTokenMinterContract } from "@/hooks/useTokenMinterContract";
import { Alchemy, Network, OwnedNft } from "alchemy-sdk";

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

// Alchemy API setup for token minter
const apiKey = "rpHRPKA38BMxeGGjtjkGTEAZc0nRtb9D";
// Configure Alchemy SDK
const alchemySettings = {
  apiKey: apiKey,
  network: Network.ETH_SEPOLIA,
};
// Initialize Alchemy client
const alchemy = new Alchemy(alchemySettings);
const CONTRACT_ADDRESS = "0xAC7333a355be9F4E8F64B91F090cCBBB96e6CF78";

// NFT interface for token minter
interface NFT {
  id: {
    tokenId: string;
  };
  title: string;
  description: string;
  media: Array<{
    gateway: string;
  }>;
  contract: {
    address: string;
  };
}

// The walkthrough interface content
const WalkthroughContent = () => {
  const { isConnected } = useAccount();
  const { address } = useWalletConnection();
  const { data: walletClient } = useWalletClient();
  const [dnsVerified, setDnsVerified] = useState(false);
  const [verifiedDomain, setVerifiedDomain] = useState('');
  
  // Setup the state
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [isWrappingName, setIsWrappingName] = useState(false);
  const [proofStatus, setProofStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [wrapStatus, setWrapStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [proofHash, setProofHash] = useState('');
  const [wrapHash, setWrapHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [nftCreated, setNftCreated] = useState(false);

  // Reset states if not connected
  useEffect(() => {
    if (!isConnected) {
      setNftCreated(false);
      setRegistrationComplete(false);
    }
  }, [isConnected]);

  // Replace ENS configuration interface with a simpler mock object
  interface EnsConfig {
    isReady: boolean;
    address: string | undefined;
  }

  const [ensConfig, setEnsConfig] = useState<EnsConfig | null>(null);

  // Simplified effect to set up the mock ENS configuration
  useEffect(() => {
    if (!address) return;
    
    // Set up a simpler mock ENS configuration
    setEnsConfig({
      isReady: true,
      address
    });
    
    console.log("ENS configuration set up successfully");
  }, [address]);

  // Mock DNSSEC proof submission
  const submitDnsProof = async () => {
    if (!verifiedDomain || !ensConfig) {
      setErrorMessage('Configuration not ready. Please connect your wallet and try again.');
      return;
    }
    
    setIsSubmittingProof(true);
    setProofStatus('submitting');
    setErrorMessage('');
    
    try {
      console.log(`Submitting DNSSEC proof for domain: ${verifiedDomain}`);
      
      // Simulate API call and blockchain interaction with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock transaction hash
      const hash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setProofHash(hash);
      setProofStatus('success');
      console.log(`DNS proof submitted with hash: ${hash}`);
    } catch (error) {
      console.error('Error submitting DNS proof:', error);
      setProofStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsSubmittingProof(false);
    }
  };

  // Mock domain wrapping
  const wrapDomainName = async () => {
    if (!verifiedDomain || !ensConfig || proofStatus !== 'success') {
      return;
    }
    
    setIsWrappingName(true);
    setWrapStatus('submitting');
    setErrorMessage('');
    
    try {
      console.log(`Wrapping domain name: ${verifiedDomain} for owner: ${ensConfig.address}`);
      
      // Simulate blockchain interaction with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock transaction hash
      const hash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setWrapHash(hash);
      setWrapStatus('success');
      console.log(`Domain wrapped with hash: ${hash}`);
      
      // Display success message
      setErrorMessage('');
    } catch (error) {
      console.error('Error wrapping domain name:', error);
      setWrapStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsWrappingName(false);
    }
  };

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
        title="Update your DNS records for ENS" 
        completed={dnsVerified} 
        active={isConnected && !dnsVerified}
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
                <li>Add a new TXT record with the following format with your wallet address:
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

              <DnsVerifier 
                onVerificationSuccess={(domain) => {
                  setDnsVerified(true);
                  setVerifiedDomain(domain);
                }} 
              />
            </div>
          </>
        )}
      </Step>
      
      <Step 
        number={3} 
        title="Register via ENS Resolver" 
        completed={registrationComplete} 
        active={isConnected && dnsVerified && !registrationComplete}
      >
        {!isConnected || !dnsVerified ? (
          <p className="text-gray-400">Complete steps 1 and 2 to proceed</p>
        ) : (
          <DnsProofAndWrapper 
            domain={verifiedDomain}
            onComplete={() => setRegistrationComplete(true)}
          />
        )}
      </Step>
      
      <Step 
        number={4} 
        title="Mint an NFT for your Domain" 
        completed={nftCreated} 
        active={isConnected && dnsVerified && registrationComplete && !nftCreated}
      >
        {!isConnected || !dnsVerified || !registrationComplete ? (
          <p className="text-gray-400">Complete steps 1, 2, and 3 to proceed</p>
        ) : (
          <NFTMinter 
            domain={verifiedDomain} 
            onComplete={() => setNftCreated(true)}
          />
        )}
      </Step>
      
      <Step 
        number={5} 
        title="Create Token from your Domain NFT" 
        completed={false} 
        active={isConnected && dnsVerified && registrationComplete && nftCreated}
      >
        {!isConnected || !dnsVerified || !registrationComplete || !nftCreated ? (
          <p className="text-gray-400">Complete steps 1, 2, 3, and 4 to proceed</p>
        ) : (
          <TokenMinter domain={verifiedDomain} />
        )}
      </Step>
      
      <div className="mt-8 text-center">
        <p className="text-gray-400 italic">Complete these steps to register your domain with ENS</p>
      </div>
    </div>
  );
};

const WalletAddressDisplay = () => {
  const { isConnected, address } = useWalletConnection();
  return (
    <div className="bg-slate-700 p-3 mt-2 rounded-md font-mono text-sm overflow-auto">
        {isConnected 
        ? `TXT _ens a=${address}`
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

// Add interface for DnsVerifier props
interface DnsVerifierProps {
  onVerificationSuccess: (domain: string) => void;
}

// Update the component with the interface
const DnsVerifier = ({ onVerificationSuccess }: DnsVerifierProps) => {
  const { address } = useWalletConnection();
  const [domain, setDomain] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DnsVerificationResult | null>(null);
  
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
      const success = foundRecord && txtValue === expectedValue;
      
      setResult({
        success,
        found: foundRecord,
        expected: expectedValue,
        actual: txtValue
      });
      
      // If verification is successful, call the success callback
      if (success && onVerificationSuccess) {
        onVerificationSuccess(domain);
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsChecking(false);
    }
  }, [domain, address, onVerificationSuccess]);
  
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
    </div>
  );
};

// Fix the interface naming to avoid conflicts with the existing StepProps interface
interface DnsWrapperProps {
  onComplete?: () => void;
  onBack?: () => void;
  domain?: string;
}

const DnsProofAndWrapper = ({ onComplete, onBack, domain }: DnsWrapperProps) => {
  const { address } = useWalletConnection();
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [isWrappingName, setIsWrappingName] = useState(false);
  const [proofStatus, setProofStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [wrapStatus, setWrapStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [proofHash, setProofHash] = useState('');
  const [wrapHash, setWrapHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Simplified ENS configuration
  const [ensReady, setEnsReady] = useState(false);
  
  // Effect to initialize ENS
  useEffect(() => {
    if (!address) return;
    
    // Mock ENS initialization
    const timer = setTimeout(() => {
      setEnsReady(true);
      console.log("ENS configuration set up successfully");
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [address]);
  
  // Mock DNSSEC proof submission
  const submitDnsProof = async () => {
    if (!domain || !ensReady) {
      setErrorMessage('Configuration not ready. Please connect your wallet and try again.');
      return;
    }
    
    setIsSubmittingProof(true);
    setProofStatus('submitting');
    setErrorMessage('');
    
    try {
      console.log(`Submitting DNSSEC proof for domain: ${domain}`);
      
      // Simulate blockchain interaction with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock transaction hash
      const hash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setProofHash(hash);
      setProofStatus('success');
      console.log(`DNS proof submitted with hash: ${hash}`);
    } catch (error) {
      console.error('Error submitting DNS proof:', error);
      setProofStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsSubmittingProof(false);
    }
  };
  
  // Mock domain wrapping
  const wrapDomainName = async () => {
    if (!domain || !ensReady || proofStatus !== 'success') {
      return;
    }
    
    setIsWrappingName(true);
    setWrapStatus('submitting');
    setErrorMessage('');
    
    try {
      console.log(`Wrapping domain name: ${domain} for owner: ${address}`);
      
      // Simulate blockchain interaction with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock transaction hash
      const hash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      setWrapHash(hash);
      setWrapStatus('success');
      console.log(`Domain wrapped with hash: ${hash}`);
    } catch (error) {
      console.error('Error wrapping domain name:', error);
      setWrapStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsWrappingName(false);
    }
  };
  
  // Production notice component
  const ProductionNotice = () => (
    <div className="border border-yellow-400 bg-yellow-50 p-4 rounded-md mb-6">
      <h3 className="text-yellow-800 font-semibold flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        ENS Integration
      </h3>
      <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
        <li>Make sure you have a wallet with Sepolia ETH connected</li>
        <li>Ensure you have DNSSEC Enabled in your DNS Dashboard</li>
      </ul>
    </div>
  );

  return (
    <div className="h-full overflow-auto">
      {/* Educational section */}
      <div className="mb-8 bg-blue-50 border border-blue-200 p-6 rounded-lg opacity-90">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">About Name Wrapping</h2>
        <p className="text-gray-700 mb-2">
          Wrapping your domain provides several benefits:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-gray-700 mb-4">
          <li>Enhanced security through permission restrictions</li>
          <li>Better subdomain management</li>
          <li>Improved compatibility with the latest ENS features</li>
          <li>Setting permissions and fuses for subdomains</li>
        </ul>
        <p className="text-sm text-gray-600">
          Learn more in the <a href="https://docs.ens.domains/ensjs-v3" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline">ENS.js documentation</a>.
        </p>
      </div>
      <ProductionNotice />
      <p className="text-white mb-6">
        Now that you've verified ownership of your domain, you can submit DNSSEC proof and wrap your domain name via the ENS Resolver. Ensure you select Onchain.
      </p>


      <Button
        
        onClick={() => { window.open("https://sepolia.app.ens.domains/" + domain, '_blank', 'noopener,noreferrer'); }}
        disabled={isSubmittingProof || proofStatus === 'success' || !ensReady}
        className={` bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-4`}
      >
        ENS Resolver
      </Button>

      {/* Display domain */}

      {errorMessage && (
        <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}


      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button onClick={onBack} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">
          Back
        </Button>
        <Button onClick={onComplete} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Continue to NFT Minting
        </Button>
      </div>
    </div>
  );
};

// Update NFTMinter to include onComplete callback
interface NFTMinterProps {
  domain: string;
  onComplete?: () => void;
}

// NFTMinter component based on NFTMinterClient
const NFTMinter = ({ domain, onComplete }: NFTMinterProps) => {
  const { address, isConnected } = useAccount();
  const [domainName, setDomainName] = useState(domain || "");
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [mintMethod] = useState<"standard" | "resolver">("standard");

  const { 
    mintNFT, 
    mintNFTViaResolver, 
    isProcessing, 
    isConfirmed,
    transactionHash: hash,
    writeError
  } = useNFTMinterContract();

  // Set domain from props when it changes
  useEffect(() => {
    if (domain) {
      setDomainName(domain);
    }
  }, [domain]);

  // Monitor transaction hash and confirmation state
  useEffect(() => {
    if (hash && isConfirmed) {
      setTransactionHash(hash);
      setShowSuccess(true);
    }
  }, [hash, isConfirmed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName) return;

    try {
      // Call the mint function
      const success = await mintNFT(domainName);
      
      // If we have a hash and successful mint
      if (success && hash) {
        setTransactionHash(hash);
        setShowSuccess(true);
      } 
      // If successful but no hash available yet
      else if (success) {
        setTimeout(() => {
          if (!showSuccess) {
            console.log("No transaction hash received, but considering mint successful");
            setShowSuccess(true);
            // Generate a placeholder transaction hash if needed
            if (!transactionHash) {
              setTransactionHash("Transaction submitted successfully");
            }
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
    }
  };

  const resetForm = () => {
    setDomainName(domain || "");
    setShowSuccess(false);
    setTransactionHash("");
  };

  // Handle manual completion for cases where transaction doesn't return a hash
  const handleManualComplete = () => {
    if (onComplete) onComplete();
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-md p-8 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold mb-6">Connect Wallet</h2>
        <p className="mb-6 text-gray-300">Please connect your wallet to mint domain NFTs.</p>
        <WalletConnectButton />
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-md p-8 rounded-xl shadow-xl">
      {showSuccess ? (
        <div className="text-center">
          <div className="mb-4 text-green-400 text-5xl">🎉</div>
          <h3 className="text-xl font-bold mb-2">NFT Minted Successfully!</h3>
          <p className="mb-4 text-gray-300">Your domain NFT for <span className="font-bold">{domainName}</span> has been minted.</p>
          {transactionHash && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
              {transactionHash.startsWith("0x") ? (
                <a 
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-sm break-all hover:underline"
                >
                  {transactionHash}
                </a>
              ) : (
                <p className="text-blue-400 text-sm break-all">{transactionHash}</p>
              )}
            </div>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={resetForm}
              className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 rounded-md transition-colors"
            >
              Mint Another NFT
            </button>
            <button
              onClick={handleManualComplete}
              className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
              Continue to Next Step
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-6">Mint Domain NFT</h2>
          
          <div className="mb-6">
            <label htmlFor="domainName" className="block text-sm font-medium mb-2">
              Domain Name
            </label>
            <input
              id="domainName"
              type="text"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="w-full p-3 bg-gray-700/50 rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
              placeholder="example.eth"
              required
            />
          </div>
          
          <div className="mb-6 p-4 bg-indigo-900/30 border border-indigo-700/50 rounded-md">
            <h4 className="text-indigo-400 font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              About Domain NFTs
            </h4>
            <p className="text-gray-300 mt-2">
              This NFT will be linked to your ENS domain, providing additional functionality
              and allowing you to showcase your domain as a digital collectible.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || !domainName}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              isProcessing || !domainName
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            } transition-colors`}
          >
            {isProcessing ? "Processing..." : "Mint NFT"}
          </button>
          
          {writeError && (
            <p className="mt-4 text-red-400 text-sm">
              Error: {writeError.message || "Failed to mint NFT"}
            </p>
          )}
          
          {isProcessing && (
            <div className="mt-4 p-3 bg-indigo-900/30 border border-indigo-700/50 rounded-md text-center">
              <div className="flex justify-center mb-2">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-purple-500"></div>
              </div>
              <p className="text-gray-300 text-sm">
                Transaction in progress... Please wait and do not close this page.
              </p>
            </div>
          )}
          
          <p className="mt-4 text-xs text-gray-400">
            Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
          </p>
        </form>
      )}
    </div>
  );
};

// TokenMinter component adapted from TokenMinterClient
const TokenMinter = ({ domain }: { domain: string }) => {
  const { address, isConnected } = useAccount();
  const [selectedNft, setSelectedNft] = useState<string>("");
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [refreshAttempts, setRefreshAttempts] = useState(0);

  const { 
    createTokenFromNFT, 
    isProcessing, 
    isConfirmed,
    transactionHash: hash,
    writeError
  } = useTokenMinterContract();

  // Fetch NFTs when address changes or when refreshing manually
  useEffect(() => {
    if (address) {
      fetchNFTs(address);
    }
  }, [address, refreshAttempts]);

  // Updated fetchNFTs function using Alchemy SDK
  const fetchNFTs = async (owner: string) => {
    try {
      setLoading(true);
      console.log("Fetching NFTs for address:", owner);
      
      // Get NFTs for owner from the specific contract
      const response = await alchemy.nft.getNftsForOwner(owner, {
        contractAddresses: [CONTRACT_ADDRESS]
      });

      console.log("NFTs found:", response.totalCount);
      
      // Transform the data to match our expected format
      const formattedNfts = response.ownedNfts.map((nft: any) => ({
        id: {
          tokenId: nft.tokenId
        },
        title: nft.title || nft.rawMetadata?.name || `Domain NFT #${nft.tokenId}`,
        description: nft.description || nft.rawMetadata?.description || "",
        media: [{
          gateway: nft.media?.[0]?.gateway || ""
        }],
        contract: {
          address: nft.contract.address
        }
      }));
      
      setNfts(formattedNfts);
    } catch (error) {
      console.error("Error fetching NFTs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNft) return;

    const nftIdNumber = parseInt(selectedNft, 10);
    if (isNaN(nftIdNumber)) return;

    try {
      const success = await createTokenFromNFT(nftIdNumber);
      
      if (success && hash) {
        setTransactionHash(hash);
        setShowSuccess(true);
      } else if (success) {
        // If successful but no hash, still show success after a delay
        setTimeout(() => {
          if (!showSuccess) {
            console.log("No transaction hash received, but token creation successful");
            setShowSuccess(true);
            setTransactionHash("Transaction completed successfully");
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error creating token:", error);
    }
  };

  const resetForm = () => {
    setSelectedNft("");
    setShowSuccess(false);
    setTransactionHash("");
    // Refresh NFTs list when resetting the form
    setRefreshAttempts(prev => prev + 1);
  };

  // Monitor transaction confirmation
  useEffect(() => {
    if (hash && isConfirmed) {
      setTransactionHash(hash);
      setShowSuccess(true);
    }
  }, [hash, isConfirmed]);

  // Function to refresh NFTs
  const refreshNFTs = () => {
    setRefreshAttempts(prev => prev + 1);
  };

  if (!isConnected) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-md p-8 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold mb-6">Connect Wallet</h2>
        <p className="mb-6 text-gray-300">Please connect your wallet to create tokens from domain NFTs.</p>
        <WalletConnectButton />
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 backdrop-blur-md p-8 rounded-xl shadow-xl">
      {showSuccess ? (
        <div className="text-center">
          <div className="mb-4 text-green-400 text-5xl">🎉</div>
          <h3 className="text-xl font-bold mb-2">Token Created Successfully!</h3>
          <p className="mb-4 text-gray-300">Your token for NFT ID <span className="font-bold">#{selectedNft}</span> has been created.</p>
          {transactionHash && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
              {transactionHash.startsWith("0x") ? (
                <a 
                  href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-sm break-all hover:underline"
                >
                  {transactionHash}
                </a>
              ) : (
                <p className="text-blue-400 text-sm break-all">{transactionHash}</p>
              )}
            </div>
          )}
          <button
            onClick={resetForm}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            Create Another Token
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-6">Create Token from Domain NFT</h2>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="nftSelector" className="block text-sm font-medium">
                Select Your Domain NFT
              </label>
              <button 
                type="button"
                onClick={refreshNFTs}
                disabled={loading}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="animate-spin h-3 w-3 border-t-2 border-blue-500 rounded-full mr-1"></div>
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    Refresh NFTs
                  </span>
                )}
              </button>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 bg-gray-700/30 rounded-md border border-gray-600">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 mb-2"></div>
                <p className="text-sm text-gray-300">Loading your NFTs...</p>
              </div>
            ) : nfts.length === 0 ? (
              <div className="p-4 bg-gray-700/50 rounded-md border border-gray-600 text-center">
                <p className="text-gray-300">No domain NFTs found</p>
                <p className="text-xs text-gray-400 mt-2">
                  You need to own domain NFTs to create tokens. If you just minted your NFT, it may take a few minutes to appear.
                </p>
                <button
                  type="button"
                  onClick={refreshNFTs}
                  className="mt-3 text-sm text-blue-400 underline"
                >
                  Refresh NFTs
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-700/30 rounded-md border border-gray-600">
                {nfts.map((nft) => (
                  <div 
                    key={nft.id.tokenId}
                    onClick={() => setSelectedNft(nft.id.tokenId)}
                    className={`p-2 rounded-md cursor-pointer transition-all ${
                      selectedNft === nft.id.tokenId 
                        ? "bg-purple-600/40 border-purple-500 border" 
                        : "bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600"
                    }`}
                  >
                    {nft.media && nft.media[0] && nft.media[0].gateway ? (
                      <img 
                        src={nft.media[0].gateway} 
                        alt={nft.title || `NFT #${nft.id.tokenId}`}
                        className="w-full h-24 object-cover rounded-md mb-2"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-800 rounded-md mb-2 flex items-center justify-center">
                        <span className="text-xl">🏠</span>
                      </div>
                    )}
                    <p className="text-sm font-medium truncate">
                      {nft.title || `Domain #${nft.id.tokenId}`}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      ID: {nft.id.tokenId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mb-6 p-4 bg-indigo-900/30 border border-indigo-700/50 rounded-md">
            <h4 className="text-indigo-400 font-bold flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              About Domain Tokens
            </h4>
            <p className="text-gray-300 mt-2">
              Creating a token from your domain NFT allows you to have a tradable ERC-20 token 
              associated with your domain that can be used in DeFi applications.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || !selectedNft || loading}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              isProcessing || !selectedNft || loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            } transition-colors`}
          >
            {isProcessing ? "Processing..." : "Create Token"}
          </button>
          
          {writeError && (
            <p className="mt-4 text-red-400 text-sm">
              Error: {writeError.message || "Failed to create token"}
            </p>
          )}
          
          {isProcessing && (
            <div className="mt-4 p-3 bg-indigo-900/30 border border-indigo-700/50 rounded-md text-center">
              <div className="flex justify-center mb-2">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-purple-500"></div>
              </div>
              <p className="text-gray-300 text-sm">
                Transaction in progress... Please wait and do not close this page.
              </p>
            </div>
          )}
          
          <p className="mt-4 text-xs text-gray-400">
            Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
          </p>
        </form>
      )}
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
          </div>

          <WalkthroughContent />
        </div>
      </main>
    </div>
  );
} 
