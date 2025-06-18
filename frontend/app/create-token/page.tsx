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
import { formatEther, parseEther } from 'viem';

// Environment variable for backend service URL
const BACKEND_SERVICE_URL = process.env.NEXT_PUBLIC_BACKEND_SERVICE_URL || 'http://localhost:8000';

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

// Backend Validation Component
const BackendValidationStep = ({ onComplete }: { onComplete: () => void }) => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { address } = useWalletConnection();

  const handleValidation = async () => {
    if (!address) {
      setValidationError('Wallet not connected');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await fetch(`${BACKEND_SERVICE_URL}/api/validate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setValidationComplete(true);
        onComplete();
      } else {
        throw new Error(data.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Backend validation error:', error);
      setValidationError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-trigger validation when component mounts
  useEffect(() => {
    if (address && !validationComplete && !isValidating && !validationError) {
      handleValidation();
    }
  }, [address, validationComplete, isValidating, validationError]);

  if (validationComplete) {
    return (
      <div className="text-center">
        <div className="mb-4 text-green-400 text-5xl">✅</div>
        <h3 className="text-xl font-bold mb-2">Backend Validation Complete!</h3>
        <p className="mb-4 text-gray-300">
          Your wallet has been validated by our backend service.
        </p>
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
            disabled={isValidating}
            className="bg-red-600 hover:bg-red-700"
          >
            {isValidating ? 'Retrying...' : 'Retry Validation'}
          </Button>
        </div>
      )}

      {!isValidating && !validationError && !validationComplete && (
        <Button
          onClick={handleValidation}
          disabled={!address}
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

  const { 
    requestRegistration, 
    registrationFee, 
    isProcessing, 
    isConfirmed, 
    transactionHash, 
    writeError 
  } = useDomainRegistrationContract();

  useEffect(() => {
    if (isConfirmed && registeredDomain && !registrationComplete) {
      setRegistrationComplete(true);
      onComplete(registeredDomain);
    }
  }, [isConfirmed, registeredDomain, registrationComplete, onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName.trim()) return;

    setIsSubmitting(true);
    setRegisteredDomain(domainName.trim());
    
    try {
      await requestRegistration(domainName.trim());
    } catch (error) {
      console.error('Error registering domain:', error);
      setIsSubmitting(false);
      setRegisteredDomain('');
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
                 <p className="text-sm text-gray-300">
           <strong>Registration Fee:</strong> {registrationFee ? formatEther(registrationFee as bigint) : '...'} ETH
         </p>
        <p className="text-xs text-gray-400 mt-2">
          This fee is required to process your domain registration request.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isProcessing || isSubmitting || !domainName.trim()}
        className="w-full"
      >
        {isProcessing || isSubmitting ? 'Processing...' : 'Register Domain'}
      </Button>

      {writeError && (
        <p className="text-red-400 text-sm">
          Error: {writeError.message || 'Failed to register domain'}
        </p>
      )}
    </form>
  );
};

// NFT Minting Component
const NFTMintingStep = ({ domain, onComplete }: { domain: string; onComplete: (nftId: number) => void }) => {
  const [mintingComplete, setMintingComplete] = useState(false);
  const [mintedNftId, setMintedNftId] = useState<number | null>(null);

  const { 
    mintNFT, 
    isProcessing, 
    isConfirmed, 
    transactionHash, 
    writeError,
    getTokenIdForDomain
  } = useNFTMinterContract();

  // Check if NFT already exists for this domain
  const { data: existingTokenId } = getTokenIdForDomain(domain);

  useEffect(() => {
    if (existingTokenId && Number(existingTokenId) > 0) {
      setMintedNftId(Number(existingTokenId));
      setMintingComplete(true);
      onComplete(Number(existingTokenId));
    }
  }, [existingTokenId, onComplete]);

  useEffect(() => {
    if (isConfirmed && !mintingComplete) {
      // When transaction is confirmed, check for the token ID
      setTimeout(() => {
        if (existingTokenId && Number(existingTokenId) > 0) {
          setMintedNftId(Number(existingTokenId));
          setMintingComplete(true);
          onComplete(Number(existingTokenId));
        }
      }, 2000);
    }
  }, [isConfirmed, mintingComplete, existingTokenId, onComplete]);

  const handleMintNFT = async () => {
    try {
      await mintNFT(domain);
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
        {transactionHash && (
          <p className="text-sm text-gray-400 mt-2">
            Transaction: <span className="font-mono text-blue-400">{transactionHash}</span>
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
          Create an NFT that represents ownership of your domain: <span className="font-bold text-blue-400">{domain}</span>
        </p>
      </div>

      <Button
        onClick={handleMintNFT}
        disabled={isProcessing}
        className="w-full bg-purple-600 hover:bg-purple-700"
      >
        {isProcessing ? 'Minting NFT...' : 'Mint Domain NFT'}
      </Button>

      {writeError && (
        <p className="text-red-400 text-sm">
          Error: {writeError.message || 'Failed to mint NFT'}
        </p>
      )}

      {isProcessing && (
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
    if (existingTokenAddress && existingTokenAddress !== '0x0000000000000000000000000000000000000000') {
      setCreatedTokenAddress(existingTokenAddress);
      setTokenCreated(true);
    }
  }, [existingTokenAddress]);

  useEffect(() => {
    if (isTokenConfirmed && !tokenCreated) {
      // Check for token address after confirmation
      setTimeout(() => {
        if (existingTokenAddress && existingTokenAddress !== '0x0000000000000000000000000000000000000000') {
          setCreatedTokenAddress(existingTokenAddress);
          setTokenCreated(true);
        }
      }, 2000);
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
          {approvalError && (
            <p className="text-red-400 text-sm mt-2">
              Error: {approvalError.message || 'Failed to set approval'}
            </p>
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

          {tokenError && (
            <p className="text-red-400 text-sm mt-2">
              Error: {tokenError.message || 'Failed to create token'}
            </p>
          )}

          {isTokenProcessing && (
            <div className="text-center mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500 mx-auto"></div>
              <p className="text-gray-300 text-sm mt-2">Creating your domain token...</p>
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
