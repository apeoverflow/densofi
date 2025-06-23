'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ReactNode } from 'react';
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { Button } from "@/components/ui/button";
import { useDomainRegistrationContract } from "@/hooks/useDomainRegistrationContract";
import { useNFTMinterContract } from "@/hooks/useNFTMinterContract";
import { useTokenMinterContract } from "@/hooks/useTokenMinterContract";
import { useLaunchpadContract } from "@/hooks/useLaunchpadContract";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { WalletAuthButton } from "@/components/WalletAuthButton";
import { useWalletAuth } from "@/hooks/useWalletAuth";
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch";
import { useDomainRegistrationEvents, useNFTMintingEvents, useDomainMintableStatus } from "@/hooks/useDomainEvents";
import { useNFTMinting } from "@/hooks/useNFTMinting";
import { formatEther, parseEther } from 'viem';

// Environment variable for backend service URL
import config from '@/lib/config';

const BACKEND_SERVICE_URL = config.apiBaseUrl;

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

// Backend Validation Component - Updated to use proper authentication
const BackendValidationStep = ({ onComplete }: { onComplete: () => void }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { address } = useWalletConnection();
  const { isAuthenticated, isLoading: authLoading, error: authError } = useWalletAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  const handleValidation = async () => {
    if (!address) {
      setValidationError('Wallet not connected');
      return;
    }

    if (!isAuthenticated) {
      setValidationError('Wallet not authenticated. Please authenticate your wallet first.');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Test backend connection with a simple status check
      const response = await authenticatedFetch(`${BACKEND_SERVICE_URL}/api/status`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Backend service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setValidationComplete(true);
        onComplete();
      } else {
        throw new Error(data.message || 'Backend validation failed');
      }
    } catch (error) {
      console.error('Backend validation error:', error);
      setValidationError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-trigger validation when wallet is authenticated
  useEffect(() => {
    if (isAuthenticated && address && !validationComplete && !isValidating && !validationError) {
      handleValidation();
    }
  }, [isAuthenticated, address, validationComplete, isValidating, validationError]);

  if (validationComplete) {
    return (
      <div className="text-center">
        <div className="mb-4 text-green-400 text-5xl">✅</div>
        <h3 className="text-xl font-bold mb-2">Backend Validation Complete!</h3>
        <p className="mb-4 text-gray-300">
          Your wallet has been authenticated and validated by our backend service.
        </p>
      </div>
    );
  }

  // Show authentication component if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-md">
          <h4 className="text-blue-400 font-bold mb-2">Backend Service Validation</h4>
          <p className="text-gray-300 text-sm mb-4">
            Connecting to our backend service to validate your wallet and prepare for domain registration.
          </p>
          <div className="text-xs text-gray-400">
            <p>Service URL: {BACKEND_SERVICE_URL}</p>
            <p>Wallet: {address}</p>
          </div>
        </div>

        <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-md">
          <h4 className="text-yellow-400 font-bold mb-2">Authentication Required</h4>
          <p className="text-gray-300 text-sm mb-4">
            Please authenticate your wallet to proceed with backend validation.
          </p>
          
          <WalletAuthButton 
            onAuthSuccess={() => {
              // Validation will auto-trigger after authentication
            }}
            onAuthError={(error) => {
              setValidationError(`Authentication failed: ${error}`);
            }}
            className="w-full"
          />
        </div>

        {authError && (
          <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md">
            <h4 className="text-red-400 font-bold mb-2">Authentication Error</h4>
            <p className="text-gray-300 text-sm">
              {authError}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-md">
        <h4 className="text-blue-400 font-bold mb-2">Backend Service Validation</h4>
        <p className="text-gray-300 text-sm mb-4">
          Connecting to our backend service to validate your wallet and prepare for domain registration.
        </p>
        <div className="text-xs text-gray-400">
          <p>Service URL: {BACKEND_SERVICE_URL}</p>
          <p>Wallet: {address}</p>
        </div>
      </div>

      {isValidating && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-300 text-sm">Validating with backend service...</p>
        </div>
      )}

      {validationError && (
        <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md">
          <h4 className="text-red-400 font-bold mb-2">Validation Failed</h4>
          <p className="text-gray-300 text-sm mb-4">
            Error: {validationError}
          </p>
          <Button
            onClick={handleValidation}
            disabled={isValidating || !isAuthenticated}
            className="bg-red-600 hover:bg-red-700"
          >
            {isValidating ? 'Retrying...' : 'Retry Validation'}
          </Button>
        </div>
      )}

      {!isValidating && !validationError && !validationComplete && isAuthenticated && (
        <Button
          onClick={handleValidation}
          disabled={!address || !isAuthenticated}
          className="w-full"
        >
          Start Backend Validation
        </Button>
      )}
    </div>
  );
};

// Domain Registration Component
const DomainRegistrationStep = ({ onComplete }: { onComplete: (domain: string) => void }) => {
  const [domainName, setDomainName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [registeredDomain, setRegisteredDomain] = useState('');
  const [isListeningForEvents, setIsListeningForEvents] = useState(false);

  const { 
    requestRegistration, 
    registrationFee, 
    isProcessing, 
    isConfirmed, 
    transactionHash, 
    writeError,
    chainId,
    isSupported,
    chainName,
    feeLoading,
    feeError 
  } = useDomainRegistrationContract();

  // Listen for domain registration events
  const { 
    latestEvent: registrationEvent, 
    clearEvents: clearRegistrationEvents,
    isListening: isEventListenerActive
  } = useDomainRegistrationEvents(registeredDomain);

  // Handle successful domain registration event
  useEffect(() => {
    if (registrationEvent && registeredDomain && !registrationComplete) {
      console.log('🎉 Domain registration event received!', registrationEvent);
      setRegistrationComplete(true);
      setIsListeningForEvents(false);
      onComplete(registeredDomain);
    }
  }, [registrationEvent, registeredDomain, registrationComplete, onComplete]);

  // Fallback: if transaction is confirmed but no event received within 30 seconds
  useEffect(() => {
    if (isConfirmed && registeredDomain && !registrationComplete) {
      const timer = setTimeout(() => {
        console.log('⏰ Fallback: Transaction confirmed, assuming registration successful');
        setRegistrationComplete(true);
        setIsListeningForEvents(false);
        onComplete(registeredDomain);
      }, 30000); // 30 second fallback

      return () => clearTimeout(timer);
    }
  }, [isConfirmed, registeredDomain, registrationComplete, onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) return;

    setIsSubmitting(true);
    setRegisteredDomain(domainName.trim());
    setIsListeningForEvents(true);
    clearRegistrationEvents(); // Clear any previous events
    
    try {
      console.log('🚀 Submitting domain registration for:', domainName.trim());
      await requestRegistration(domainName.trim());
      console.log('📡 Now listening for registration events...');
    } catch (error) {
      console.error('Error registering domain:', error);
      setIsSubmitting(false);
      setRegisteredDomain('');
      setIsListeningForEvents(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="text-center">
        <div className="mb-4 text-green-400 text-5xl">✅</div>
        <h3 className="text-xl font-bold mb-2">Domain Registration Complete!</h3>
        <p className="mb-4 text-gray-300">
          Your domain <span className="font-bold text-blue-400">{registeredDomain}</span> has been registered.
        </p>
        {transactionHash && (
          <p className="text-sm text-gray-400">
            Transaction: <span className="font-mono text-blue-400">{transactionHash}</span>
          </p>
        )}
      </div>
    );
  }

  // Show chain compatibility issues first
  if (!isSupported) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-md">
          <h4 className="text-yellow-400 font-bold mb-2">Unsupported Network</h4>
          <p className="text-gray-300 text-sm mb-4">
            You're currently connected to {chainName} (Chain ID: {chainId}). 
            Please switch to one of the supported networks:
          </p>
          <ul className="text-gray-300 text-sm list-disc list-inside">
            <li>Testnet 747</li>
            <li>Sepolia (Chain ID: 11155111)</li>
          </ul>
        </div>
      </div>
    );
  }

  // Show fee loading state
  if (feeLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-md">
          <h4 className="text-blue-400 font-bold mb-2">Loading Contract Information</h4>
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500"></div>
            <p className="text-gray-300 text-sm">
              Loading registration fee from {chainName}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show fee error
  if (feeError) {
    return (
      <div className="space-y-4">
        <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md">
          <h4 className="text-red-400 font-bold mb-2">Contract Error</h4>
          <p className="text-gray-300 text-sm mb-4">
            Failed to load contract information: {feeError.message}
          </p>
          <p className="text-gray-400 text-xs">
            Chain: {chainName} (ID: {chainId})
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="domainName" className="block text-sm font-medium mb-2">
          Domain Name
        </label>
        <input
          id="domainName"
          type="text"
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          className="w-full p-3 bg-gray-700/50 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="mydomain.eth"
          required
          disabled={isProcessing || isSubmitting}
        />
      </div>

      <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-md">
        <h4 className="text-blue-400 font-bold mb-2">Registration Details</h4>
        <div className="text-gray-300 text-sm space-y-1">
          <p>Network: {chainName}</p>
          <p><strong>Registration Fee:</strong> {registrationFee ? formatEther(registrationFee as bigint) : '...'} ETH</p>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          This fee is required to process your domain registration request.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isProcessing || isSubmitting || !domainName.trim() || !registrationFee}
        className="w-full"
      >
        {isProcessing || isSubmitting ? 'Processing...' : 'Register Domain'}
      </Button>

      {/* Transaction Status */}
      {transactionHash && !registrationComplete && (
        <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-md">
          <h4 className="text-blue-400 font-bold mb-2">Transaction Submitted</h4>
          <p className="text-gray-300 text-sm mb-2">
            Transaction Hash: <code className="bg-slate-800 px-2 py-1 rounded text-xs">{transactionHash}</code>
          </p>
          {isListeningForEvents && (
            <div className="flex items-center gap-2 mt-3">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-400 text-sm">
                📡 Listening for registration events...
              </p>
            </div>
          )}
          {isConfirmed && (
            <p className="text-yellow-400 text-sm mt-2">
              ⏳ Transaction confirmed, waiting for registration event...
            </p>
          )}
        </div>
      )}

      {writeError && (
        <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md">
          <h4 className="text-red-400 font-bold mb-2">Transaction Failed</h4>
          <p className="text-gray-300 text-sm">
            {writeError.message || 'Failed to register domain'}
          </p>
        </div>
      )}
    </form>
  );
};

// NFT Minting Component
const NFTMintingStep = ({ domain, onComplete }: { domain: string; onComplete: (nftId: number) => void }) => {
  const [mintingComplete, setMintingComplete] = useState(false);
  const [mintedNftId, setMintedNftId] = useState<number | null>(null);
  const [waitingForMintable, setWaitingForMintable] = useState(true);

  // Use the new NFT minting hook
  const { 
    mintNFT, 
    isLoading: isMintingProcessing, 
    isConfirming, 
    isConfirmed, 
    txHash, 
    error: mintingError,
    success: mintingSuccess
  } = useNFTMinting();

  // Monitor domain mintable status and ownership
  const {
    isReadyForMinting,
    isDomainMintable,
    domainOwner,
    existingTokenId,
    latestEvent: mintableEvent,
    isPolling,
    startPolling,
    pollContractState,
    isListening: isMintableListening
  } = useDomainMintableStatus(domain);

  // Listen for NFT minting events
  const { 
    latestEvent: mintingEvent, 
    clearEvents: clearMintingEvents,
    isListening: isEventListenerActive
  } = useNFTMintingEvents(domain);

  const { address } = useAccount();

  // Check if NFT already exists for this domain
  useEffect(() => {
    if (existingTokenId && Number(existingTokenId) > 0) {
      setMintedNftId(Number(existingTokenId));
      setMintingComplete(true);
      setWaitingForMintable(false);
      onComplete(Number(existingTokenId));
    }
  }, [existingTokenId, onComplete]);

  // Handle successful NFT minting event
  useEffect(() => {
    if (mintingEvent && !mintingComplete) {
      console.log('🎉 NFT minting event received!', mintingEvent);
      const tokenId = Number(mintingEvent.tokenId);
      setMintedNftId(tokenId);
      setMintingComplete(true);
      setWaitingForMintable(false);
      onComplete(tokenId);
    }
  }, [mintingEvent, mintingComplete, onComplete]);

  // Handle successful minting from the new hook
  useEffect(() => {
    if (mintingSuccess && isConfirmed && !mintingComplete) {
      console.log('🎉 NFT minting transaction confirmed!');
      // Poll for the token ID
      pollContractState();
    }
  }, [mintingSuccess, isConfirmed, mintingComplete, pollContractState]);

  // Monitor when domain becomes mintable
  useEffect(() => {
    if (mintableEvent) {
      console.log('🔔 Domain mintable status changed:', mintableEvent);
      pollContractState(); // Refresh contract state
    }
  }, [mintableEvent, pollContractState]);

  // Start polling when component mounts
  useEffect(() => {
    if (domain && address && !mintingComplete) {
      console.log('🔄 Starting domain mintable status monitoring for:', domain);
      startPolling();
    }
  }, [domain, address, mintingComplete, startPolling]);

  // Update waiting state based on minting readiness
  useEffect(() => {
    if (isReadyForMinting) {
      setWaitingForMintable(false);
    }
  }, [isReadyForMinting]);

  const handleMintNFT = () => {
    clearMintingEvents(); // Clear any previous events
    
    try {
      console.log('🚀 Submitting NFT mint for domain:', domain);
      mintNFT(domain);
      console.log('📡 Now listening for NFT minting events...');
    } catch (error) {
      console.error('Error minting NFT:', error);
    }
  };

  if (mintingComplete && mintedNftId) {
    return (
      <div className="text-center">
        <div className="mb-4 text-green-400 text-5xl">🎉</div>
        <h3 className="text-xl font-bold mb-2">NFT Minted Successfully!</h3>
        <p className="mb-4 text-gray-300">
          NFT for domain <span className="font-bold text-blue-400">{domain}</span> has been minted.
        </p>
        <p className="text-sm text-gray-400">
          NFT ID: <span className="font-mono text-blue-400">#{mintedNftId}</span>
        </p>
        {txHash && (
          <p className="text-sm text-gray-400 mt-2">
            Transaction: <span className="font-mono text-blue-400">{txHash}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-purple-900/30 border border-purple-700/50 p-4 rounded-md">
        <h4 className="text-purple-400 font-bold mb-2">Domain NFT Minting</h4>
        <p className="text-gray-300 text-sm">
          Create an NFT that provides the minting rights of your domain: <span className="font-bold text-blue-400">{domain}</span>
        </p>
      </div>

      {/* Mintable Status Monitoring */}
      {waitingForMintable && !isReadyForMinting && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-md">
          <h4 className="text-yellow-400 font-bold mb-2">Waiting for Domain to be Mintable</h4>
          <p className="text-gray-300 text-sm mb-2">
            Monitoring domain ownership and mintable status...
          </p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>Domain: <span className="font-mono">{domain}</span></p>
            <p>Is Mintable: <span className={isDomainMintable ? 'text-green-400' : 'text-red-400'}>
              {isDomainMintable ? 'Yes' : 'No'}
            </span></p>
            <p>Domain Owner: <span className="font-mono">{domainOwner || 'Not set'}</span></p>
            <p>Your Address: <span className="font-mono">{address}</span></p>
            <p>You Own Domain: <span className={domainOwner && address && domainOwner.toLowerCase() === address.toLowerCase() ? 'text-green-400' : 'text-red-400'}>
              {domainOwner && address && domainOwner.toLowerCase() === address.toLowerCase() ? 'Yes' : 'No'}
            </span></p>
          </div>
          {(isMintableListening || isPolling) && (
            <div className="flex items-center gap-2 mt-3">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-400 text-sm">
                📡 Listening for domain mintable events...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ready to Mint */}
      {isReadyForMinting && !mintingComplete && (
        <div className="bg-green-900/30 border border-green-700/50 p-4 rounded-md">
          <h4 className="text-green-400 font-bold mb-2">Ready to Mint NFT!</h4>
          <p className="text-gray-300 text-sm">
            Domain is now mintable and you are the verified owner.
          </p>
        </div>
      )}

      <Button
        onClick={handleMintNFT}
        disabled={!isReadyForMinting || isMintingProcessing}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
      >
        {isMintingProcessing ? 'Minting NFT...' : 
         !isReadyForMinting ? 'Waiting for Domain to be Mintable...' : 
         'Mint Domain NFT'}
      </Button>

      {/* Transaction Status */}
      {txHash && !mintingComplete && (
        <div className="bg-purple-900/30 border border-purple-700/50 p-4 rounded-md">
          <h4 className="text-purple-400 font-bold mb-2">NFT Mint Transaction Submitted</h4>
          <p className="text-gray-300 text-sm mb-2">
            Transaction Hash: <code className="bg-slate-800 px-2 py-1 rounded text-xs">{txHash}</code>
          </p>
          {isEventListenerActive && (
            <div className="flex items-center gap-2 mt-3">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-400 text-sm">
                📡 Listening for NFT minting events...
              </p>
            </div>
          )}
          {isConfirming && (
            <p className="text-yellow-400 text-sm mt-2">
              ⏳ Transaction confirming...
            </p>
          )}
          {isConfirmed && (
            <p className="text-yellow-400 text-sm mt-2">
              ⏳ Transaction confirmed, waiting for NFT minting event...
            </p>
          )}
        </div>
      )}

      {mintingError && (
        <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md">
          <h4 className="text-red-400 font-bold mb-2">Transaction Failed</h4>
          <p className="text-gray-300 text-sm">
            {mintingError.message || 'Failed to mint NFT'}
          </p>
        </div>
      )}

      {isMintingProcessing && !txHash && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-300 text-sm mt-2">Minting your domain NFT...</p>
        </div>
      )}
    </div>
  );
};

// Token Creation Component
const TokenCreationStep = ({ domain, nftId }: { domain: string; nftId: number }) => {
  const [creationMethod, setCreationMethod] = useState<'direct' | 'launchpad'>('direct');
  const [approvalComplete, setApprovalComplete] = useState(false);
  const [tokenCreated, setTokenCreated] = useState(false);
  const [createdTokenAddress, setCreatedTokenAddress] = useState('');
  const [isWaitingForToken, setIsWaitingForToken] = useState(false);

  const { 
    createTokenFromNFT, 
    fixedFee,
    isProcessing: isTokenProcessing, 
    isConfirmed: isTokenConfirmed, 
    transactionHash: tokenTxHash, 
    writeError: tokenError,
    getTokenAddress
  } = useTokenMinterContract();

  const { 
    setApprovalForAll, 
    isProcessing: isApprovalProcessing, 
    isConfirmed: isApprovalConfirmed, 
    transactionHash: approvalTxHash, 
    writeError: approvalError,
    isApprovedForAll
  } = useNFTMinterContract();

  const { address } = useAccount();

  // Check if already approved
  const { data: isApproved } = isApprovedForAll(address || '');

  // Check if token already exists
  const { data: existingTokenAddress } = getTokenAddress(nftId);

  useEffect(() => {
    if (isApproved) {
      setApprovalComplete(true);
    }
  }, [isApproved]);

  useEffect(() => {
    if (isApprovalConfirmed) {
      setApprovalComplete(true);
    }
  }, [isApprovalConfirmed]);

  useEffect(() => {
    if (existingTokenAddress && typeof existingTokenAddress === 'string' && existingTokenAddress !== '0x0000000000000000000000000000000000000000') {
      setCreatedTokenAddress(existingTokenAddress);
      setTokenCreated(true);
    }
  }, [existingTokenAddress]);

  useEffect(() => {
    if (isTokenConfirmed && !tokenCreated) {
      setIsWaitingForToken(true);
      // Check for token address after confirmation with multiple attempts
      const checkTokenAddress = (attempts = 0) => {
        if (attempts >= 10) {
          console.warn('Max attempts reached checking for token address');
          setIsWaitingForToken(false);
          return;
        }
        
        setTimeout(() => {
          if (existingTokenAddress && typeof existingTokenAddress === 'string' && existingTokenAddress !== '0x0000000000000000000000000000000000000000') {
            setCreatedTokenAddress(existingTokenAddress);
            setTokenCreated(true);
            setIsWaitingForToken(false);
          } else {
            checkTokenAddress(attempts + 1);
          }
        }, 2000 + (attempts * 1000)); // Increasing delay
      };
      
      checkTokenAddress();
    }
  }, [isTokenConfirmed, tokenCreated, existingTokenAddress]);

  const handleApproval = async () => {
    try {
      await setApprovalForAll();
    } catch (error) {
      console.error('Error setting approval:', error);
    }
  };

  const handleCreateToken = async () => {
    try {
      await createTokenFromNFT(nftId, creationMethod === 'direct');
    } catch (error) {
      console.error('Error creating token:', error);
    }
  };

  if (tokenCreated) {
    return (
      <div className="text-center">
        <div className="mb-4 text-green-400 text-5xl">🚀</div>
        <h3 className="text-xl font-bold mb-2">Token Created Successfully!</h3>
        <p className="mb-4 text-gray-300">
          Token for <span className="font-bold text-blue-400">{domain}</span> has been created!
        </p>
        <div className="bg-green-900/30 border border-green-700/50 p-4 rounded-md">
          <p className="text-sm text-gray-300">
            <strong>Token Address:</strong>
          </p>
          <p className="font-mono text-green-400 text-sm break-all">
            {createdTokenAddress}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Method: {creationMethod === 'direct' ? 'Direct Receipt' : 'Launchpad'}
          </p>
        </div>
        {tokenTxHash && (
          <p className="text-sm text-gray-400 mt-4">
            Transaction: <span className="font-mono text-blue-400">{tokenTxHash}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Creation Method Selection */}
      <div>
        <h4 className="text-lg font-bold mb-4">Choose Token Creation Method</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              creationMethod === 'direct'
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
            }`}
            onClick={() => setCreationMethod('direct')}
          >
            <h5 className="font-bold text-blue-400 mb-2">Direct Receipt</h5>
            <p className="text-sm text-gray-300 mb-2">
              Receive all tokens directly to your wallet immediately.
            </p>
            <p className="text-xs text-gray-400">
              Fee: {fixedFee ? formatEther(fixedFee as bigint) : '...'} ETH
            </p>
          </div>
          
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              creationMethod === 'launchpad'
                ? 'border-purple-500 bg-purple-900/30'
                : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
            }`}
            onClick={() => setCreationMethod('launchpad')}
          >
            <h5 className="font-bold text-purple-400 mb-2">Launchpad</h5>
            <p className="text-sm text-gray-300 mb-2">
              Send tokens to launchpad for trading and eventual Uniswap launch.
            </p>
            <p className="text-xs text-gray-400">
              Fee: FREE
            </p>
          </div>
        </div>
      </div>

      {/* Approval Step */}
      {!approvalComplete && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-md">
          <h4 className="text-yellow-400 font-bold mb-2">NFT Contract Approval Required</h4>
          <p className="text-gray-300 text-sm mb-4">
            Before creating a token, you must approve the token minter contract to transfer your NFT.
          </p>
          <Button
            onClick={handleApproval}
            disabled={isApprovalProcessing}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {isApprovalProcessing ? 'Approving...' : 'Approve Token Minter'}
          </Button>

          {/* Approval Transaction Status */}
          {approvalTxHash && !approvalComplete && (
            <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-md mt-4">
              <h4 className="text-yellow-400 font-bold mb-2">Approval Transaction Submitted</h4>
              <p className="text-gray-300 text-sm mb-2">
                Transaction Hash: <code className="bg-slate-800 px-2 py-1 rounded text-xs">{approvalTxHash}</code>
              </p>
              {isApprovalProcessing && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <p className="text-yellow-400 text-sm">
                    ⏳ Waiting for approval confirmation...
                  </p>
                </div>
              )}
              {isApprovalConfirmed && (
                <p className="text-green-400 text-sm mt-2">
                  ✅ Approval confirmed! You can now create your token.
                </p>
              )}
            </div>
          )}

          {approvalError && (
            <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md mt-4">
              <h4 className="text-red-400 font-bold mb-2">Approval Failed</h4>
              <p className="text-gray-300 text-sm">
                {approvalError.message || 'Failed to set approval'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Token Creation */}
      {approvalComplete && (
        <div>
          <div className="bg-indigo-900/30 border border-indigo-700/50 p-4 rounded-md mb-4">
            <h4 className="text-indigo-400 font-bold mb-2">Ready to Create Token</h4>
            <p className="text-gray-300 text-sm">
              Your NFT is approved. You can now create your domain token using the {creationMethod} method.
            </p>
            {creationMethod === 'direct' && fixedFee && (
              <p className="text-xs text-gray-400 mt-2">
                This will cost {formatEther(fixedFee as bigint)} ETH and you'll receive all 1,000,000 tokens immediately.
              </p>
            )}
            {creationMethod === 'launchpad' && (
              <p className="text-xs text-gray-400 mt-2">
                This is free and tokens will be sent to the launchpad for trading.
              </p>
            )}
          </div>

          <Button
            onClick={handleCreateToken}
            disabled={isTokenProcessing}
            className={`w-full ${
              creationMethod === 'direct' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {isTokenProcessing ? 'Creating Token...' : `Create Token (${creationMethod})`}
          </Button>

          {/* Token Creation Transaction Status */}
          {tokenTxHash && !tokenCreated && (
            <div className={`${
              creationMethod === 'direct' 
                ? 'bg-blue-900/30 border-blue-700/50' 
                : 'bg-purple-900/30 border-purple-700/50'
            } border p-4 rounded-md mt-4`}>
              <h4 className={`${
                creationMethod === 'direct' ? 'text-blue-400' : 'text-purple-400'
              } font-bold mb-2`}>
                Token Creation Transaction Submitted
              </h4>
              <p className="text-gray-300 text-sm mb-2">
                Transaction Hash: <code className="bg-slate-800 px-2 py-1 rounded text-xs">{tokenTxHash}</code>
              </p>
              <div className="text-xs text-gray-400 space-y-1 mb-3">
                <p>Domain: <span className="font-mono text-blue-400">{domain}</span></p>
                <p>NFT ID: <span className="font-mono text-purple-400">#{nftId}</span></p>
                <p>Method: <span className="font-mono text-green-400">{creationMethod}</span></p>
                {creationMethod === 'direct' && fixedFee && (
                  <p>Fee: <span className="font-mono text-yellow-400">{formatEther(fixedFee as bigint)} ETH</span></p>
                )}
              </div>
              {isTokenProcessing && (
                <div className="flex items-center gap-2 mt-3">
                  <div className={`animate-pulse w-2 h-2 ${
                    creationMethod === 'direct' ? 'bg-blue-500' : 'bg-purple-500'
                  } rounded-full`}></div>
                  <p className={`${
                    creationMethod === 'direct' ? 'text-blue-400' : 'text-purple-400'
                  } text-sm`}>
                    🔄 Processing token creation...
                  </p>
                </div>
              )}
              {isTokenConfirmed && !tokenCreated && (
                <div className="space-y-2 mt-3">
                  <p className="text-green-400 text-sm">
                    ✅ Transaction confirmed! Checking for token address...
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full"></div>
                    <p className="text-green-400 text-sm">
                      {isWaitingForToken ? '📡 Polling for token deployment...' : '📡 Waiting for token deployment...'}
                    </p>
                  </div>
                  {isWaitingForToken && (
                    <p className="text-yellow-400 text-xs">
                      ⏳ This may take up to 20 seconds to complete...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {tokenError && (
            <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md mt-4">
              <h4 className="text-red-400 font-bold mb-2">Token Creation Failed</h4>
              <p className="text-gray-300 text-sm mb-2">
                {tokenError.message || 'Failed to create token'}
              </p>
              <div className="text-xs text-gray-400">
                <p>Domain: <span className="font-mono">{domain}</span></p>
                <p>NFT ID: <span className="font-mono">#{nftId}</span></p>
                <p>Method: <span className="font-mono">{creationMethod}</span></p>
              </div>
            </div>
          )}

          {isTokenProcessing && !tokenTxHash && (
            <div className="text-center mt-4">
              <div className={`animate-spin rounded-full h-8 w-8 border-t-2 ${
                creationMethod === 'direct' ? 'border-blue-500' : 'border-purple-500'
              } mx-auto`}></div>
              <p className="text-gray-300 text-sm mt-2">
                Creating your domain token using {creationMethod} method...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main Create Token Content
const CreateTokenContent = () => {
  const { isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [backendValidated, setBackendValidated] = useState(false);
  const [registeredDomain, setRegisteredDomain] = useState('');
  const [mintedNftId, setMintedNftId] = useState<number | null>(null);

  const handleBackendValidated = () => {
    setBackendValidated(true);
    if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // Auto advance to step 2 when wallet connects
  useEffect(() => {
    if (isConnected && currentStep === 1) {
      setCurrentStep(2);
    }
  }, [isConnected, currentStep]);

  const handleDomainRegistered = (domain: string) => {
    setRegisteredDomain(domain);
    setCurrentStep(4);
  };

  const handleNFTMinted = (nftId: number) => {
    setMintedNftId(nftId);
    setCurrentStep(5);
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
              Connect your wallet to start creating domain tokens.
            </p>
            <div className="flex justify-center mt-4">
              <WalletConnectButton />
            </div>
          </div>
        )}
      </Step>

      <Step 
        number={2} 
        title="Backend Validation" 
        completed={backendValidated} 
        active={isConnected && !backendValidated}
      >
        {!isConnected ? (
          <p className="text-gray-400">Complete step 1 to proceed</p>
        ) : backendValidated ? (
          <p className="text-green-400">✅ Backend validation completed successfully!</p>
        ) : (
          <BackendValidationStep onComplete={handleBackendValidated} />
        )}
      </Step>
      
      <Step 
        number={3} 
        title="Register Domain" 
        completed={currentStep > 3} 
        active={isConnected && backendValidated && currentStep === 3}
      >
        {!isConnected || !backendValidated ? (
          <p className="text-gray-400">Complete previous steps to proceed</p>
        ) : currentStep > 3 ? (
          <p className="text-green-400">✅ Domain "{registeredDomain}" registered successfully!</p>
        ) : (
          <DomainRegistrationStep onComplete={handleDomainRegistered} />
        )}
      </Step>
      
      <Step 
        number={4} 
        title="Mint Domain NFT" 
        completed={currentStep > 4} 
        active={isConnected && currentStep === 4}
      >
        {currentStep < 4 ? (
          <p className="text-gray-400">Complete previous steps to proceed</p>
        ) : currentStep > 4 ? (
          <p className="text-green-400">✅ NFT #{mintedNftId} minted successfully!</p>
        ) : (
          <NFTMintingStep domain={registeredDomain} onComplete={handleNFTMinted} />
        )}
      </Step>
      
      <Step 
        number={5} 
        title="Create Domain Token" 
        completed={false} 
        active={isConnected && currentStep === 5}
      >
        {currentStep < 5 ? (
          <p className="text-gray-400">Complete previous steps to proceed</p>
        ) : (
          <TokenCreationStep domain={registeredDomain} nftId={mintedNftId!} />
        )}
      </Step>
      
      <div className="mt-8 text-center">
        <p className="text-gray-400 italic">Complete these steps to create your domain token</p>
      </div>
    </div>
  );
};

export default function CreateTokenPage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return null;
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className=" mb-8">
            <h1 className="text-4xl font-bold text-white mb-6">
              Create Domain Token
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl ">
              Transform your domain into a tradeable token. Register a domain, mint an NFT, and create a token for trading.
            </p>
          </div>

          <CreateTokenContent />
        </div>
      </main>
    </div>
  );
}
