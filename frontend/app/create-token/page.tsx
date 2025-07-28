'use client';

import Image from 'next/image';
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
import { useDomainVerification, type DomainVerificationError } from "@/hooks/useDomainVerification";
import { formatEther, parseEther } from 'viem';
import React from 'react';
import { Alchemy, Network } from "alchemy-sdk";
import { NFT_MINTER_SEPOLIA_ADDRESS as CONTRACT_ADDRESS } from "../../constants/contract";
import { InteractiveBackground } from "@/components/ui/InteractiveBackground";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedHeadingGlow } from "@/components/ui/AnimatedHeadingGlow";



// Environment variable for backend service URL
import config from '@/lib/config';

const BACKEND_SERVICE_URL = config.apiBaseUrl;

// Alchemy configuration
const apiKey = "rpHRPKA38BMxeGGjtjkGTEAZc0nRtb9D";
const alchemySettings = {
  apiKey: apiKey,
  network: Network.ETH_SEPOLIA,
};
const alchemy = new Alchemy(alchemySettings);

// NFT interface
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

// Step component props interface
interface StepProps {
  title: string;
  completed: boolean;
  active: boolean;
  children: ReactNode;
}

// Step component to show completed/pending steps with glass card styling - mobile optimized
const Step = ({ title, completed, active, children }: StepProps) => {
  return (
    <div className="mb-3 sm:mb-4 lg:mb-6 relative group">
      <GlassCard className={`relative transition-all duration-500 ${active ? 'shadow-xl shadow-blue-500/20 border-blue-500/30' : completed ? 'shadow-lg shadow-green-500/10 border-green-500/20' : 'border-white/5'} ${active ? 'hover:shadow-2xl hover:shadow-blue-500/30' : ''}`}>
        {/* Background glow effect */}
        <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 ${active ? 'group-hover:opacity-100 bg-gradient-to-br from-blue-500/5 to-indigo-500/5' : completed ? 'bg-gradient-to-br from-green-500/3 to-emerald-500/3' : ''}`}></div>

        <div className="relative z-10 p-2 sm:p-3 lg:p-4">
          <div className="flex items-center mb-2 sm:mb-3 lg:mb-4">
            <div className={`w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 transition-all duration-300 ${completed ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/40' : active ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/40' : 'bg-slate-700/50'} ${active ? 'group-hover:scale-110' : ''}`}>
              {completed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-2.5 lg:h-2.5 rounded-full transition-all duration-300 ${active ? 'bg-blue-200 group-hover:bg-white' : 'bg-gray-400'}`} />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-base sm:text-lg lg:text-xl font-bold transition-colors duration-300 ${completed ? 'text-green-400' : active ? 'text-white group-hover:text-blue-300' : 'text-gray-400'}`}>
                {title}
              </h3>
              <div className={`w-8 sm:w-10 lg:w-12 h-0.5 mt-1 transition-all duration-300 ${completed ? 'bg-gradient-to-r from-green-400 to-emerald-400' : active ? 'bg-gradient-to-r from-blue-400 to-indigo-400 group-hover:w-10 sm:group-hover:w-12 lg:group-hover:w-16' : 'bg-gray-600'}`}></div>
            </div>
          </div>

          <div className="ml-8 sm:ml-11 lg:ml-13">
            {children}
          </div>
        </div>

        {/* Corner accent */}
        <div className={`absolute top-2 sm:top-3 right-2 sm:right-3 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-colors duration-300 ${completed ? 'bg-green-400/60' : active ? 'bg-blue-400/30 group-hover:bg-blue-400/60' : 'bg-gray-600/30'}`}></div>
      </GlassCard>
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
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-400">
            <img src="/pixel/star-pixel.png" alt="Success" className="w-8 h-8" />
          </div>
        </div>
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

// Safe wrapper for domain verification to prevent hook errors from crashing the page
const SafeDomainVerificationWrapper = ({ onComplete }: { onComplete: (domain: string) => void }) => {
  const [wrapperError, setWrapperError] = useState<string | null>(null);

  if (wrapperError) {
    return (
      <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md">
        <h4 className="text-red-400 font-bold mb-2">Service Unavailable</h4>
        <p className="text-gray-300 text-sm mb-4">
          The domain verification service is currently unavailable. This may be due to a network issue or service maintenance.
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Error: {wrapperError}
        </p>
        <div className="space-y-2">
          <button
            onClick={() => setWrapperError(null)}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
          >
            Try Again
          </button>
          <p className="text-xs text-gray-400 text-center">
            If the problem persists, please try refreshing the page or contact support.
          </p>
        </div>
      </div>
    );
  }

  try {
    return <DomainVerificationStep onComplete={onComplete} />;
  } catch (error) {
    console.error('Domain verification component error:', error);
    setWrapperError(error instanceof Error ? error.message : 'Component initialization failed');
    return null;
  }
};

// Domain Verification Component with Error Safety
const DomainVerificationStep = ({ onComplete }: { onComplete: (domain: string) => void }) => {
  const [domainName, setDomainName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verifiedDomain, setVerifiedDomain] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [hookError, setHookError] = useState<string | null>(null);
  const [isTestingBackend, setIsTestingBackend] = useState(false);
  const [backendTestResult, setBackendTestResult] = useState<string | null>(null);
  const [isBackendAuthenticated, setIsBackendAuthenticated] = useState<boolean | null>(null);
  const [isCheckingBackendAuth, setIsCheckingBackendAuth] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Safely use the domain verification hook with error boundary
  let verifyDomain: any = null;
  let isVerifying = false;
  let verificationError: string | null = null;
  let canVerify = false;

  try {
    const hookResult = useDomainVerification();
    verifyDomain = hookResult.verifyDomain;
    isVerifying = hookResult.isVerifying;
    verificationError = hookResult.error;
    canVerify = hookResult.canVerify;
  } catch (error) {
    console.error('Error initializing domain verification hook:', error);
    setHookError(error instanceof Error ? error.message : 'Hook initialization failed');
  }

  const { address } = useWalletConnection();
  const { isAuthenticated } = useWalletAuth();

  // Function to check backend authentication
  const checkBackendAuthentication = async () => {
    if (!address) return false;

    setIsCheckingBackendAuth(true);
    try {
      const response = await fetch(`${BACKEND_SERVICE_URL}/api/debug/wallet-auth`, {
        headers: {
          'X-Wallet-Address': address,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      const isBackendAuth = data.success && !data.debug?.walletNotFound;
      setIsBackendAuthenticated(isBackendAuth);
      return isBackendAuth;
    } catch (error) {
      console.error('Failed to check backend auth:', error);
      setIsBackendAuthenticated(false);
      return false;
    } finally {
      setIsCheckingBackendAuth(false);
    }
  };

  // Check backend authentication when component mounts or address changes
  useEffect(() => {
    if (address && isAuthenticated) {
      checkBackendAuthentication();
    }
  }, [address, isAuthenticated]);

  const handleVerifyDomain = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!domainName.trim() || !address) return;

    // Clear previous errors
    setCustomError(null);
    setHookError(null);

    // Check if hook failed to initialize
    if (!verifyDomain) {
      setCustomError('Domain verification service is currently unavailable. Please try refreshing the page.');
      return;
    }

    // Check authentication before proceeding
    if (!isAuthenticated) {
      setCustomError('Wallet authentication required. Please complete the backend validation step first.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🔍 Verifying domain ownership for:', domainName.trim());
      console.log('🔍 Using wallet address:', address);
      console.log('🔍 Backend service URL:', BACKEND_SERVICE_URL);

      // Call domain verification
      let result;
      try {
        result = await verifyDomain(domainName.trim(), address);
      } catch (hookCallError: any) {
        console.log('Domain verification failed:', hookCallError);
        
        // If it's an auth error, clear localStorage and force re-authentication
        if (hookCallError && typeof hookCallError === 'object' && 'type' in hookCallError) {
          const domainError = hookCallError as DomainVerificationError;
          
          if (domainError.type === 'auth_error') {
            console.log('Auth error detected - clearing localStorage and resetting auth state');
            localStorage.removeItem('wallet-auth');
            setCustomError('Authentication expired. Please re-authenticate your wallet using the button above.');
            // Force page refresh to update auth state
            window.location.reload();
            return;
          }
          
          throw new Error(domainError.message);
        }

        // Fallback error handling
        const errorMessage = hookCallError instanceof Error ? hookCallError.message : 'Domain verification failed';
        throw new Error(errorMessage);
      }

      console.log('✅ Domain verification result:', result);

      if (result && result.isVerified) {
        setVerificationResult(result);
        setVerifiedDomain(domainName.trim());
        setVerificationComplete(true);
        setCustomError(null);
        onComplete(domainName.trim());
      } else {
        console.warn('Domain verification returned false:', result);
        setCustomError(`Domain ownership verification failed. Expected wallet: ${address}, Domain: ${domainName.trim()}. Please ensure your DNS TXT record is set up correctly.`);
      }
    } catch (error: any) {
      console.log('Error verifying domain:', error);

      // Prevent the error from propagating and crashing the page
      let errorMessage = 'Unknown error occurred';

      try {
        errorMessage = error instanceof Error ? error.message : String(error);
      } catch (parseError) {
        console.warn('Could not parse error message:', parseError);
      }

      // Handle specific authentication errors
      if (errorMessage.toLowerCase().includes('wallet not authenticated') ||
        errorMessage.toLowerCase().includes('authentication required') ||
        errorMessage.toLowerCase().includes('authentication expired')) {
        setCustomError(`Authentication Error: ${errorMessage}. Please complete the backend validation step again.`);
      } else if (errorMessage.toLowerCase().includes('endpoint not found')) {
        setCustomError(`Service Configuration Error: ${errorMessage}. Please contact support.`);
      } else if (errorMessage.toLowerCase().includes('network error')) {
        setCustomError(`${errorMessage}. Please check your internet connection and verify the backend service is running.`);
      } else if (errorMessage.toLowerCase().includes('dns') ||
        errorMessage.toLowerCase().includes('txt record')) {
        setCustomError(`DNS Error: ${errorMessage}. Please ensure your DNS TXT record is set up correctly and has propagated.`);
      } else if (errorMessage.toLowerCase().includes('domain') &&
        errorMessage.toLowerCase().includes('not found')) {
        setCustomError(`Domain Error: ${errorMessage}. Please check that your domain exists and is reachable.`);
      } else if (errorMessage.toLowerCase().includes('server error')) {
        setCustomError(`Backend Server Error: ${errorMessage}. The backend service may be experiencing issues.`);
      } else if (errorMessage.toLowerCase().includes('service error')) {
        setCustomError(`Service Error: ${errorMessage}. The verification service may be temporarily unavailable.`);
      } else {
        setCustomError(`Verification Error: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verificationComplete) {
    return (
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-400">
            <img src="/pixel/star-pixel.png" alt="Success" className="w-8 h-8" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">Domain Ownership Verified!</h3>
        <p className="mb-4 text-gray-300">
          Your ownership of <span className="font-bold text-blue-400">{verifiedDomain}</span> has been confirmed.
        </p>
        {verificationResult && (
          <div className="bg-green-900/30 border border-green-700/50 p-4 rounded-md">
            <p className="text-sm text-gray-300 mb-2">
              <strong>Verification Details:</strong>
            </p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>Domain: <span className="font-mono text-green-400">{verificationResult.domainName}</span></p>
              <p>Wallet: <span className="font-mono text-blue-400">{verificationResult.walletAddress}</span></p>
              <p>Auth Type: <span className="text-purple-400">{verificationResult.authType}</span></p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleVerifyDomain} className="space-y-4">
      <div>
        <label htmlFor="verifyDomainName" className="block text-sm font-medium mb-2">
          Domain Name to Verify
        </label>
        <input
          id="verifyDomainName"
          type="text"
          value={domainName}
          onChange={(e) => setDomainName(e.target.value)}
          className="w-full p-3 bg-gray-700/50 rounded-md border border-gray-600 focus:border-blue-500 focus:outline-none"
          placeholder="example.com"
          required
          disabled={isVerifying || isSubmitting}
        />
      </div>

      <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-md">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-blue-400 font-bold">Domain Ownership Verification</h4>
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 border border-gray-600 hover:border-gray-500 rounded transition-colors"
            title="Toggle debug information"
          >
            {showDebugInfo ? 'Hide Debug' : 'Debug'}
          </button>
        </div>
        <p className="text-gray-300 text-sm mb-3">
          To verify domain ownership, you need to add a DNS TXT record to your domain.
        </p>

        {/* Authentication prompt when needed */}
        {isAuthenticated && isBackendAuthenticated === false && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-md">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-yellow-400 text-sm font-medium mb-1">Authentication Required</p>
                <p className="text-gray-300 text-xs">You need to authenticate with our backend service to verify domain ownership.</p>
              </div>
              <WalletAuthButton
                onAuthSuccess={() => {
                  checkBackendAuthentication();
                  setCustomError(null);
                }}
                onAuthError={(error) => {
                  setCustomError(`Authentication failed: ${error}`);
                }}
                className="px-3 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 whitespace-nowrap"
              />
            </div>
          </div>
        )}

        {/* Debug Information - Only shown when showDebugInfo is true */}
        {showDebugInfo && (
          <div className="mb-4 p-3 bg-slate-800/50 rounded-md border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-slate-300 font-medium text-sm">System Status</h5>
              {isCheckingBackendAuth && (
                <div className="flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-t border-blue-400"></div>
                  <span className="text-xs text-blue-400">Checking...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Wallet:</span>
                  <span className={address ? 'text-green-400' : 'text-red-400'}>
                    {address ? (
                      <span className="flex items-center gap-1">
                        <img src="/pixel/star-pixel.png" alt="Success" className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <img src="/pixel/diamond-pixel.png" alt="Error" className="w-3 h-3" />
                        Not connected
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Frontend Auth:</span>
                  <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                    {isAuthenticated ? (
                      <span className="flex items-center gap-1">
                        <img src="/pixel/star-pixel.png" alt="Success" className="w-3 h-3" />
                        Authenticated
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <img src="/pixel/diamond-pixel.png" alt="Error" className="w-3 h-3" />
                        Not authenticated
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Backend Auth:</span>
                  <span className={
                    isBackendAuthenticated === null ? 'text-gray-400' :
                      isBackendAuthenticated ? 'text-green-400' : 'text-red-400'
                  }>
                    {isBackendAuthenticated === null ? (
                      <span className="flex items-center gap-1">
                        <img src="/pixel/link-pixelated.png" alt="Loading" className="w-3 h-3 animate-pulse" />
                        Checking...
                      </span>
                    ) : isBackendAuthenticated ? (
                      <span className="flex items-center gap-1">
                        <img src="/pixel/star-pixel.png" alt="Success" className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <img src="/pixel/diamond-pixel.png" alt="Error" className="w-3 h-3" />
                        Required
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Can Verify:</span>
                  <span className={canVerify && isBackendAuthenticated ? 'text-green-400' : 'text-red-400'}>
                    {canVerify && isBackendAuthenticated ? (
                      <span className="flex items-center gap-1">
                        <img src="/pixel/star-pixel.png" alt="Success" className="w-3 h-3" />
                        Ready
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <img src="/pixel/diamond-pixel.png" alt="Error" className="w-3 h-3" />
                        Not ready
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-gray-600">
              <button
                onClick={async () => {
                  setIsTestingBackend(true);
                  setBackendTestResult(null);
                  try {
                    const response = await fetch(`${BACKEND_SERVICE_URL}/api/debug/wallet-auth`, {
                      headers: {
                        'X-Wallet-Address': address || '',
                        'Content-Type': 'application/json'
                      }
                    });
                    const data = await response.json();
                    setBackendTestResult(`Backend Auth Test: ${JSON.stringify(data, null, 2)}`);
                  } catch (error) {
                    setBackendTestResult(`Backend Auth Test Failed: ${error instanceof Error ? error.message : String(error)}`);
                  } finally {
                    setIsTestingBackend(false);
                  }
                }}
                disabled={isTestingBackend || !address}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs"
              >
                {isTestingBackend ? 'Testing...' : 'Test Backend Auth'}
              </button>
            </div>

            {backendTestResult && (
              <div className="mt-2 p-2 bg-gray-900 rounded">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {backendTestResult}
                </pre>
              </div>
            )}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowInstructions(!showInstructions)}
          className="text-blue-400 border-blue-400 hover:bg-blue-400/10 mb-3"
        >
          {showInstructions ? 'Hide' : 'Show'} DNS Setup Instructions
        </Button>

        {showInstructions && (
          <div className="bg-slate-800/50 p-4 rounded-md">
            <h5 className="text-sm font-bold text-yellow-400 mb-2">DNS TXT Record Setup:</h5>
            <div className="text-xs text-gray-300 space-y-2">
              <p><strong>1.</strong> Go to your domain's DNS settings</p>
              <p><strong>2.</strong> Add a new TXT record with:</p>
              <div className="bg-slate-900 p-2 rounded border-l-4 border-blue-500 ml-4">
                <p><strong>Name/Host:</strong> <code className="text-blue-400">_densofi</code></p>
                <p><strong>Value:</strong> <code className="text-green-400">a={address}</code></p>
                <p><strong>TTL:</strong> <code className="text-gray-400">300</code> (or default)</p>
              </div>
              <p><strong>3.</strong> Wait a few minutes for DNS propagation</p>
              <p><strong>4.</strong> Click "Verify Domain Ownership" below</p>
            </div>
            <div className="mt-3 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded">
              <p className="text-xs text-yellow-300">
                <strong>Note:</strong> DNS changes can take up to 24 hours to propagate fully, but usually work within minutes.
              </p>
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={isVerifying || isSubmitting || !domainName.trim() || !canVerify || !isAuthenticated || !verifyDomain || !!hookError || isBackendAuthenticated === false || isCheckingBackendAuth}
        className="w-full"
      >
        {hookError ? 'Verification Service Unavailable' :
          isCheckingBackendAuth ? 'Checking Authentication...' :
            isBackendAuthenticated === false ? 'Backend Authentication Required' :
              isVerifying || isSubmitting ? 'Verifying Domain...' :
                'Verify Domain Ownership'}
      </Button>



      {(!canVerify && isAuthenticated) && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-md">
          <h4 className="text-yellow-400 font-bold mb-2">Verification Not Available</h4>
          <p className="text-gray-300 text-sm">
            Please ensure your wallet is connected and authenticated to verify domain ownership.
          </p>
        </div>
      )}

      {(customError || verificationError || hookError) && (
        <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-md">
          <h4 className="text-red-400 font-bold mb-2">Verification Failed</h4>
          <p className="text-gray-300 text-sm mb-4">
            {customError || verificationError || hookError || 'Unable to verify domain ownership'}
          </p>

          <div className="text-xs text-gray-400">
            <p>Common issues:</p>
            <ul className="list-disc list-inside ml-2 mt-1">
              <li>DNS TXT record not set up correctly</li>
              <li>DNS propagation still in progress</li>
              <li>Wallet address in TXT record doesn't match connected wallet</li>
              <li>Domain doesn't exist or isn't accessible</li>
              <li>Authentication expired - use the "Authenticate Wallet" button above</li>
            </ul>
          </div>
        </div>
      )}

      {isSubmitting && !verificationError && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-300 text-sm">Checking DNS records for domain ownership...</p>
        </div>
      )}
    </form>
  );
};

// Domain Registration Component - Updated to use pre-verified domain
const DomainRegistrationStep = ({ domain, onComplete }: { domain: string; onComplete: (domain: string) => void }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
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
  } = useDomainRegistrationEvents(domain);

  // Handle successful domain registration event
  useEffect(() => {
    if (registrationEvent && domain && !registrationComplete) {
      console.log('🎉 Domain registration event received!', registrationEvent);
      setRegistrationComplete(true);
      setIsListeningForEvents(false);
      onComplete(domain);
    }
  }, [registrationEvent, domain, registrationComplete, onComplete]);

  // Fallback: if transaction is confirmed but no event received within 30 seconds
  useEffect(() => {
    if (isConfirmed && domain && !registrationComplete) {
      const timer = setTimeout(() => {
        console.log('⏰ Fallback: Transaction confirmed, assuming registration successful');
        setRegistrationComplete(true);
        setIsListeningForEvents(false);
        onComplete(domain);
      }, 30000); // 30 second fallback

      return () => clearTimeout(timer);
    }
  }, [isConfirmed, domain, registrationComplete, onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setIsListeningForEvents(true);
    clearRegistrationEvents(); // Clear any previous events

    try {
      console.log('🚀 Submitting domain registration for:', domain);
      await requestRegistration(domain);
      console.log('📡 Now listening for registration events...');
    } catch (error) {
      console.error('Error registering domain:', error);
      setIsSubmitting(false);
      setIsListeningForEvents(false);
    }
  };

  if (registrationComplete) {
    return (
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-400">
            <img src="/pixel/star-pixel.png" alt="Success" className="w-8 h-8" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">Domain Registration Complete!</h3>
        <p className="mb-4 text-gray-300">
          Your domain <span className="font-bold text-blue-400">{domain}</span> has been registered.
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
      <div className="bg-green-900/30 border border-green-700/50 p-4 rounded-md">
        <h4 className="text-green-400 font-bold mb-2 flex items-center gap-2">
          <img src="/pixel/star-pixel.png" alt="Success" className="w-4 h-4" />
          Domain Verified & Ready for Registration
        </h4>
        <p className="text-gray-300 text-sm mb-2">
          Domain ownership has been verified for: <span className="font-bold text-blue-400">{domain}</span>
        </p>
        <p className="text-gray-400 text-xs">
          You can now proceed with blockchain registration to secure your domain.
        </p>
      </div>

      <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-md">
        <h4 className="text-blue-400 font-bold mb-2">Registration Details</h4>
        <div className="text-gray-300 text-sm space-y-1">
          <p>Domain: <span className="font-mono text-blue-400">{domain}</span></p>
          <p>Network: {chainName}</p>
          <p><strong>Registration Fee:</strong> {registrationFee ? formatEther(registrationFee as bigint) : '...'} ETH</p>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          This fee is required to process your domain registration request on the blockchain.
        </p>
      </div>

      <Button
        type="submit"
        disabled={isProcessing || isSubmitting || !registrationFee}
        className="w-full"
      >
        {isProcessing || isSubmitting ? 'Processing...' : 'Register Domain on Blockchain'}
      </Button>

      {/* Transaction Status */}
      {transactionHash && !registrationComplete && (
        <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-md">
          <h4 className="text-blue-400 font-bold mb-2">Transaction Submitted</h4>
          <p className="text-gray-300 text-sm mb-2">
            Transaction Hash: <a 
              href={`https://evm.flowscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 px-2 py-1 rounded text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700 transition-colors duration-200 font-mono"
            >{transactionHash}</a>
          </p>
          {isListeningForEvents && (
            <div className="flex items-center gap-2 mt-3">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-400 text-sm">
                🔄 Listening for registration events...
              </p>
            </div>
          )}
          {isConfirmed && (
            <p className="text-yellow-400 text-sm mt-2">
              ⌛ Transaction confirmed, waiting for registration event...
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
  const [isSearchingForNFT, setIsSearchingForNFT] = useState(false);
  const [searchAttempts, setSearchAttempts] = useState(0);

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

  // Function to search for newly minted NFT using Alchemy API
  const searchForNewNFT = async (attemptNumber: number = 1) => {
    if (!address || mintingComplete) return;

    setIsSearchingForNFT(true);
    console.log(`🔍 Searching for newly minted NFT (attempt ${attemptNumber})...`);

    try {
      let foundNfts: NFT[] = [];

      // Method 1: Try backend API first
      try {
        console.log("🔄 Method 1: Checking backend API for new NFT...");
        const backendResponse = await fetch(`${BACKEND_SERVICE_URL}/api/nfts/${address}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          console.log('📋 Backend NFT response:', backendData);

          if (backendData.success && backendData.data && backendData.data.nfts && Array.isArray(backendData.data.nfts)) {
            foundNfts = backendData.data.nfts.map((nft: any) => ({
              id: {
                tokenId: nft.tokenId.toString()
              },
              title: nft.title || `Domain NFT #${nft.tokenId}`,
              description: nft.description || "",
              media: [{
                gateway: nft.image || ""
              }],
              contract: {
                address: CONTRACT_ADDRESS
              }
            }));
          }
        }
      } catch (backendError) {
        console.warn("⚠️ Backend API not available:", backendError);
      }

      // Method 2: Fallback to Alchemy
      if (foundNfts.length === 0) {
        try {
          console.log("🔄 Method 2: Trying Alchemy as fallback...");
          const response = await alchemy.nft.getNftsForOwner(address, {
            contractAddresses: [CONTRACT_ADDRESS]
          });

          foundNfts = response.ownedNfts.map((nft: any) => ({
            id: {
              tokenId: nft.tokenId
            },
            title: nft.title || `Domain NFT #${nft.tokenId}`,
            description: nft.description || "",
            media: [{
              gateway: nft.media?.[0]?.gateway || ""
            }],
            contract: {
              address: nft.contract.address
            }
          }));
        } catch (alchemyError) {
          console.warn("⚠️ Alchemy also failed:", alchemyError);
        }
      }

      console.log('📋 Found NFTs:', foundNfts.length);

      // Look for the newest NFT (highest token ID)
      if (foundNfts.length > 0) {
        const sortedNfts = foundNfts.sort((a, b) => {
          const tokenIdA = parseInt(a.id.tokenId, 10);
          const tokenIdB = parseInt(b.id.tokenId, 10);
          return tokenIdB - tokenIdA;
        });

        const newestNft = sortedNfts[0];
        const tokenId = parseInt(newestNft.id.tokenId, 10);

        console.log(`🎉 Found newest NFT with token ID: ${tokenId}`);
        setMintedNftId(tokenId);
        setMintingComplete(true);
        setWaitingForMintable(false);
        setIsSearchingForNFT(false);
        onComplete(tokenId);
        return;
      }

      // If no NFTs found and we haven't exceeded max attempts, try again
      if (attemptNumber < 10) {
        const delay = Math.min(2000 + (attemptNumber * 1000), 8000); // Increasing delay, max 8s
        console.log(`⏳ No NFTs found, retrying in ${delay}ms...`);
        setTimeout(() => {
          setSearchAttempts(attemptNumber);
          searchForNewNFT(attemptNumber + 1);
        }, delay);
      } else {
        console.warn('⚠️ Max search attempts reached, stopping NFT search');
        setIsSearchingForNFT(false);
      }
    } catch (error) {
      console.error('❌ Error searching for NFT:', error);
      setIsSearchingForNFT(false);
    }
  };

  // Check if NFT already exists for this domain
  useEffect(() => {
    if (existingTokenId && Number(existingTokenId) > 0) {
      setMintedNftId(Number(existingTokenId));
      setMintingComplete(true);
      setWaitingForMintable(false);
      onComplete(Number(existingTokenId));
    }
  }, [existingTokenId, onComplete]);

  // Handle successful NFT minting event (backup method)
  useEffect(() => {
    if (mintingEvent && !mintingComplete && !isSearchingForNFT) {
      console.log('🎉 NFT minting event received!', mintingEvent);
      const tokenId = Number(mintingEvent.tokenId);
      setMintedNftId(tokenId);
      setMintingComplete(true);
      setWaitingForMintable(false);
      onComplete(tokenId);
    }
  }, [mintingEvent, mintingComplete, onComplete, isSearchingForNFT]);

  // Handle successful minting from the new hook - start NFT search
  useEffect(() => {
    if (mintingSuccess && isConfirmed && !mintingComplete && !isSearchingForNFT) {
      console.log('🎉 NFT minting transaction confirmed! Starting NFT search...');
      // Start searching for the NFT using Alchemy API
      searchForNewNFT(1);
    }
  }, [mintingSuccess, isConfirmed, mintingComplete, isSearchingForNFT]);

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
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-400">
            <img src="/pixel/game-pixel.png" alt="NFT" className="w-8 h-8" />
          </div>
        </div>
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
                Listening for domain mintable events...
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
            Transaction Hash: <a 
              href={`https://evm.flowscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-800 px-2 py-1 rounded text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700 transition-colors duration-200 font-mono"
            >{txHash}</a>
          </p>
          {isConfirming && (
            <p className="text-yellow-400 text-sm mt-2">
              Transaction confirming...
            </p>
          )}
          {isConfirmed && !isSearchingForNFT && (
            <p className="text-yellow-400 text-sm mt-2">
              Transaction confirmed, waiting for NFT minting event...
            </p>
          )}
          {isSearchingForNFT && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                <p className="text-blue-400 text-sm">
                  Searching for your newly minted NFT... (attempt {searchAttempts}/10)
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Using Alchemy API to find your NFT. This may take a few moments.
              </p>
            </div>
          )}
          {isEventListenerActive && !isSearchingForNFT && (
            <div className="flex items-center gap-2 mt-3">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-400 text-sm">
                📡 Listening for NFT minting events...
              </p>
            </div>
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

// Helper function to safely format fee
const formatFeeHelper = (fee: unknown): string => {
  try {
    if (typeof fee === 'bigint') {
      return formatEther(fee);
    } else if (fee && typeof fee === 'object' && 'toString' in fee) {
      return formatEther(BigInt(fee.toString()));
    } else if (typeof fee === 'string' || typeof fee === 'number') {
      return formatEther(BigInt(fee.toString()));
    }
    return '...';
  } catch {
    return '...';
  }
};

// Modal component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-2 lg:p-4">
      {/* Backdrop with enhanced blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal container - full screen on mobile, centered on larger screens */}
      <div className="relative w-full h-full sm:w-auto sm:h-auto sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl sm:max-h-[90vh] lg:max-h-[85vh] overflow-hidden sm:rounded-xl lg:rounded-2xl">
        <GlassCard className="relative h-full sm:h-auto overflow-hidden shadow-none sm:shadow-2xl sm:shadow-blue-500/20 rounded-none sm:rounded-xl lg:rounded-2xl">
          {/* Animated background glow inside modal - hidden on mobile for performance */}
          <div className="hidden sm:block absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-5 lg:top-10 left-1/4 w-24 lg:w-32 h-24 lg:h-32 bg-gradient-to-r from-blue-900/15 via-indigo-800/20 to-purple-900/15 rounded-full blur-xl animate-pulse opacity-20" style={{ animationDuration: '6s' }}></div>
            <div className="absolute bottom-5 lg:bottom-10 right-1/4 w-20 lg:w-28 h-20 lg:h-28 bg-gradient-to-l from-teal-900/10 via-cyan-800/15 to-blue-900/10 rounded-full blur-lg animate-pulse opacity-15" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
            <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-br from-purple-900/10 via-blue-800/15 to-indigo-900/10 rounded-full blur-xl animate-pulse opacity-10" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
          </div>

          {/* Mobile-first Header */}
          <div className="sticky top-0 bg-slate-900/98 sm:bg-slate-900/95 backdrop-blur-xl border-b border-white/10 p-3 sm:p-4 flex justify-between items-center relative z-10 min-h-[56px] sm:min-h-auto">
            <div className="relative">
              <h2 className="text-xl sm:text-xl lg:text-2xl font-bold text-white">
                <span className="block sm:hidden">Create Token</span>
                <span className="hidden sm:block">Create Domain Token</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-all duration-300 p-2 rounded-full hover:bg-white/10 group flex-shrink-0"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile-optimized Content with proper scrolling */}
          <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto h-[calc(100vh-56px)] sm:h-auto sm:max-h-[calc(90vh-80px)] lg:max-h-[calc(85vh-100px)] relative z-10">
            <div className="space-y-4 sm:space-y-6">
              {children}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// NFT Selection Component for existing NFTs
const NFTSelectionStep = ({ onComplete }: { onComplete: (nftId: number, domain: string) => void }) => {
  const { address } = useAccount();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNft, setSelectedNft] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Fetch NFTs when address changes
  useEffect(() => {
    if (address) {
      fetchNFTs(address);
    }
  }, [address]);

  const fetchNFTs = async (owner: string) => {
    try {
      setLoading(true);
      setError("");
      console.log("🔍 Fetching NFTs for address:", owner);
      console.log("🔍 Contract address:", CONTRACT_ADDRESS);

      let formattedNfts: NFT[] = [];
      const methods = [];

      // Method 1: Try backend API first
      try {
        console.log("🔄 Method 1: Trying backend API...");
        const backendResponse = await fetch(`${BACKEND_SERVICE_URL}/api/nfts/${owner}`, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          console.log("📋 Backend NFT response:", backendData);

          if (backendData.success && backendData.data && backendData.data.nfts && Array.isArray(backendData.data.nfts)) {
            formattedNfts = backendData.data.nfts.map((nft: any) => ({
              id: {
                tokenId: nft.tokenId
              },
              title: nft.title || `Domain NFT #${nft.tokenId}`,
              description: nft.description || "",
              media: [{
                gateway: nft.image || ""
              }],
              contract: {
                address: CONTRACT_ADDRESS
              }
            }));
            methods.push('Backend API');
          }
        }
      } catch (backendError) {
        console.warn("⚠️ Backend API not available:", backendError);
        methods.push('Backend API (failed)');
      }

      // Method 2: Try Alchemy as fallback
      if (formattedNfts.length === 0) {
        try {
          console.log("🔄 Method 2: Trying Alchemy API fallback...");
          const response = await alchemy.nft.getNftsForOwner(owner, {
            contractAddresses: [CONTRACT_ADDRESS]
          });

          console.log("📋 Raw Alchemy response:", response);

          formattedNfts = response.ownedNfts.map((nft: any, index: number) => {
            console.log(`📋 Processing NFT ${index + 1}:`, nft);

            return {
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
            };
          });
          methods.push('Alchemy Fallback');

          // Try getting all NFTs and filtering if no results
          if (formattedNfts.length === 0) {
            console.log("🔄 Trying Alchemy with all NFTs filter...");
            const allNftsResponse = await alchemy.nft.getNftsForOwner(owner);

            const filteredNfts = allNftsResponse.ownedNfts.filter(nft =>
              nft.contract.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
            );

            if (filteredNfts.length > 0) {
              formattedNfts = filteredNfts.map((nft: any) => ({
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
              methods.push('Alchemy Filtered');
            }
          }
        } catch (alchemyError) {
          console.warn("⚠️ Alchemy API also failed:", alchemyError);
          methods.push('Alchemy Fallback (failed)');
        }
      }

      setDebugInfo({
        contractAddress: CONTRACT_ADDRESS,
        ownerAddress: owner,
        totalNfts: formattedNfts.length,
        networkDetected: 'Ethereum Sepolia',
        methodsAttempted: methods,
        successfulMethod: formattedNfts.length > 0 ? methods[methods.findIndex(m => !m.includes('failed'))] : 'none',
        rawResponse: formattedNfts
      });

      console.log("✅ Final formatted NFTs:", formattedNfts);
      console.log("📊 Methods attempted:", methods);
      setNfts(formattedNfts);

    } catch (error) {
      console.error("❌ Error fetching NFTs:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNFT = () => {
    if (!selectedNft) return;

    const nft = nfts.find(n => n.id.tokenId === selectedNft);
    const domain = nft?.title?.replace(/^Domain NFT #\d+:?\s*/, '') || `nft-${selectedNft}`;

    onComplete(parseInt(selectedNft, 10), domain);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-4">Select Your Domain NFT</h3>
        <p className="text-gray-300">
          Choose an existing domain NFT to create tokens from, or register a new domain below.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mb-4"></div>
          <p className="text-gray-300">Loading your domain NFTs...</p>
          <p className="text-xs text-gray-400 mt-2">Checking contract: {CONTRACT_ADDRESS}</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-400">
              <img src="/pixel/diamond-pixel.png" alt="Warning" className="w-8 h-8" />
            </div>
          </div>
          <h4 className="text-xl font-bold mb-2 text-red-400">Error Loading NFTs</h4>
          <p className="text-gray-300 mb-4">
            {error}
          </p>
          <button
            onClick={() => address && fetchNFTs(address)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
          >
            Try Again
          </button>
          {debugInfo && (
            <details className="mt-4 text-left">
              <summary className="text-xs text-gray-400 cursor-pointer">Debug Info</summary>
              <pre className="text-xs text-gray-400 mt-2 bg-slate-800 p-2 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ) : nfts.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gray-500/20 flex items-center justify-center border-2 border-gray-400">
              <img src="/pixel/link-pixelated.png" alt="Document" className="w-8 h-8" />
            </div>
          </div>
          <h4 className="text-xl font-bold mb-2">No Domain NFTs Found</h4>
          <p className="text-gray-300 mb-4">
            You don't have any domain NFTs yet. Create your first domain below!
          </p>
          <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-md mb-4">
            <p className="text-yellow-400 text-sm mb-2">
              <strong>Troubleshooting:</strong>
            </p>
            <ul className="text-xs text-gray-300 list-disc list-inside space-y-1">
              <li>Make sure you're connected to the correct wallet</li>
              <li>Verify you're on the right network</li>
              <li>Check if your NFT was minted recently (may take a few minutes to appear)</li>
              <li>Contract being searched: <code className="bg-slate-800 px-1 rounded text-xs">{CONTRACT_ADDRESS}</code></li>
            </ul>
          </div>
          <button
            onClick={() => address && fetchNFTs(address)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm mr-2"
          >
            Refresh NFTs
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-4 bg-slate-800/30 rounded-lg">
            {nfts.map((nft) => (
              <div
                key={nft.id.tokenId}
                onClick={() => setSelectedNft(nft.id.tokenId)}
                className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${selectedNft === nft.id.tokenId
                    ? "border-blue-500 bg-blue-900/30"
                    : "border-gray-600 bg-gray-700/30 hover:border-gray-500"
                  }`}
              >
                {nft.media && nft.media[0] && nft.media[0].gateway ? (
                  <img
                    src={nft.media[0].gateway}
                    alt={nft.title || `NFT #${nft.id.tokenId}`}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-800 rounded-md mb-3 flex items-center justify-center">
                    <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center">
                      <img src="/pixel/game-pixel.png" alt="NFT" className="w-6 h-6" />
                    </div>
                  </div>
                )}
                <h5 className="font-bold text-white truncate mb-1">
                  {nft.title || `Domain #${nft.id.tokenId}`}
                </h5>
                <p className="text-sm text-gray-400">
                  ID: {nft.id.tokenId}
                </p>
                {selectedNft === nft.id.tokenId && (
                  <div className="mt-2 text-blue-400 text-sm font-medium flex items-center gap-1">
                    <img src="/pixel/star-pixel.png" alt="Selected" className="w-3 h-3" />
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button
              onClick={handleSelectNFT}
              disabled={!selectedNft}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3"
            >
              Create Token from Selected NFT
            </Button>
          </div>
        </>
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
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-400">
            <img src="/pixel/rocket-pixel.png" alt="Token" className="w-8 h-8" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2">Token Created Successfully!</h3>
        <p className="mb-4 text-gray-300">
          Token for <span className="font-bold text-blue-400">{domain}</span> has been created!
        </p>
        <div className="bg-green-900/30 border border-green-700/50 p-4 rounded-md">
          <p className="text-sm text-gray-300">
            <strong>Token Address:</strong>
          </p>
          <p className="font-mono text-green-400 text-sm break-all">
            <a target="_blank" href={'https://evm.flowscan.io/address/' + createdTokenAddress}>{createdTokenAddress}</a>
          </p>
          {/* <p className="text-xs text-gray-400 mt-2">
            Method: {creationMethod === 'direct' ? 'Direct Receipt' : 'Launchpad'}
          </p> */}
        </div>
        {tokenTxHash && (
          <p className="text-sm text-gray-400 mt-4">
            Transaction: <a 
              href={`https://evm.flowscan.io/tx/${tokenTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:text-blue-300 hover:underline transition-colors duration-200"
            >{tokenTxHash}</a>
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
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${creationMethod === 'direct'
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
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${creationMethod === 'launchpad'
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
                Transaction Hash: <a 
                  href={`https://evm.flowscan.io/tx/${approvalTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 px-2 py-1 rounded text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700 transition-colors duration-200 font-mono"
                >{approvalTxHash}</a>
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
                <p className="text-green-400 text-sm mt-2 flex items-center gap-1">
                  <img src="/pixel/star-pixel.png" alt="Success" className="w-3 h-3" />
                  Approval confirmed! You can now create your token.
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
            {creationMethod === 'direct' && fixedFee !== undefined && (
              <p className="text-xs text-gray-400 mt-2">
                This will cost {formatFeeHelper(fixedFee)} ETH and you'll receive all 1,000,000 tokens immediately.
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
            disabled={isTokenProcessing || isWaitingForToken || tokenCreated}
            className={`w-full ${creationMethod === 'direct'
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-purple-600 hover:bg-purple-700'
              } ${(isTokenProcessing || isWaitingForToken || tokenCreated) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isTokenProcessing ? 'Creating Token...' : 
             isWaitingForToken ? 'Deploying Token...' : 
             tokenCreated ? 'Token Created!' : 
             `Create Token (${creationMethod})`}
          </Button>

          {/* Token Creation Transaction Status */}
          {tokenTxHash && !tokenCreated && (
            <div className={`${creationMethod === 'direct'
                ? 'bg-blue-900/30 border-blue-700/50'
                : 'bg-purple-900/30 border-purple-700/50'
              } border p-4 rounded-md mt-4`}>
              <h4 className={`${creationMethod === 'direct' ? 'text-blue-400' : 'text-purple-400'
                } font-bold mb-2`}>
                Token Creation Transaction Submitted
              </h4>
              <p className="text-gray-300 text-sm mb-2">
                Transaction Hash: <a 
                  href={`https://evm.flowscan.io/tx/${tokenTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 px-2 py-1 rounded text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700 transition-colors duration-200 font-mono"
                >{tokenTxHash}</a>
              </p>
              <div className="text-xs text-gray-400 space-y-1 mb-3">
                <p>Domain: <span className="font-mono text-blue-400">{domain}</span></p>
                <p>NFT ID: <span className="font-mono text-purple-400">#{nftId}</span></p>
                <p>Method: <span className="font-mono text-green-400">{creationMethod}</span></p>
                {creationMethod === 'direct' && fixedFee !== undefined && (
                  <p>Fee: <span className="font-mono text-yellow-400">{formatFeeHelper(fixedFee)} ETH</span></p>
                )}
              </div>
              {isTokenProcessing && (
                <div className="flex items-center gap-2 mt-3">
                  <div className={`animate-pulse w-2 h-2 ${creationMethod === 'direct' ? 'bg-blue-500' : 'bg-purple-500'
                    } rounded-full`}></div>
                  <p className={`${creationMethod === 'direct' ? 'text-blue-400' : 'text-purple-400'
                    } text-sm`}>
                    🔄 Processing token creation...
                  </p>
                </div>
              )}
              {isTokenConfirmed && !tokenCreated && (
                <div className="space-y-2 mt-3">
                  <p className="text-green-400 text-sm flex items-center gap-1">
                    <img src="/pixel/star-pixel.png" alt="Success" className="w-3 h-3" />
                    Transaction confirmed! Checking for token address...
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
              <div className={`animate-spin rounded-full h-8 w-8 border-t-2 ${creationMethod === 'direct' ? 'border-blue-500' : 'border-purple-500'
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

// Main Create Token Content - Modal-based with choice between new domain and existing NFT
const CreateTokenContent = () => {
  const { isConnected } = useAccount();
  const { isAuthenticated } = useWalletAuth();
  const [mode, setMode] = useState<'choose' | 'new-domain' | 'existing-nft'>('choose');
  const [currentStep, setCurrentStep] = useState(3); // Start at step 3
  const [backendValidated, setBackendValidated] = useState(false);
  const [domainVerified, setDomainVerified] = useState(false);
  const [verifiedDomain, setVerifiedDomain] = useState('');
  const [registeredDomain, setRegisteredDomain] = useState('');
  const [mintedNftId, setMintedNftId] = useState<number | null>(null);
  const [fromExistingNFT, setFromExistingNFT] = useState(false);

  // Check for issues that require showing steps 1 & 2
  const hasWalletIssue = !isConnected;
  const hasBackendIssue = isConnected && !isAuthenticated;

  // Auto-set backend validated if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setBackendValidated(true);
    }
  }, [isAuthenticated]);

  const handleBackendValidated = () => {
    setBackendValidated(true);
    setCurrentStep(3);
  };

  const handleDomainVerified = (domain: string) => {
    setVerifiedDomain(domain);
    setDomainVerified(true);
    setCurrentStep(4);
  };

  const handleDomainRegistered = (domain: string) => {
    setRegisteredDomain(domain);
    setCurrentStep(5);
  };

  const handleNFTMinted = (nftId: number) => {
    setMintedNftId(nftId);
    setCurrentStep(6);
  };

  const handleExistingNFTSelected = (nftId: number, domain: string) => {
    setMintedNftId(nftId);
    setRegisteredDomain(domain);
    setFromExistingNFT(true);
    setCurrentStep(6);
  };

  // Mode Selection Screen
  if (mode === 'choose' && !hasWalletIssue && !hasBackendIssue) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-teal-400 bg-clip-text text-transparent">
            Choose Your Path
          </h2>
          <p className="text-gray-300 text-sm sm:text-base lg:text-lg">
            Select how you'd like to create your domain tokens
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8">
          <div
            onClick={() => setMode('existing-nft')}
            className="group relative cursor-pointer transform transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            <GlassCard className="relative p-4 sm:p-6 lg:p-8 h-full overflow-hidden border-2 border-blue-500/30 hover:border-blue-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/40">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Floating orbs animation */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-cyan-400/15 to-blue-400/15 rounded-full blur-lg group-hover:scale-125 transition-transform duration-700 delay-100"></div>

              {/* Enhanced icon section */}
              <div className="relative mb-4 sm:mb-6 lg:mb-8 flex justify-center">
                <div className="relative group/icon">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl blur-lg sm:blur-xl group-hover:from-blue-500/50 group-hover:to-purple-500/50 transition-all duration-500"></div>
                  <div className="relative p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-blue-500/20 rounded-lg sm:rounded-xl lg:rounded-2xl backdrop-blur-sm border border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300 group-hover:scale-110">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-md sm:rounded-lg lg:rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center group-hover:from-blue-400/40 group-hover:to-purple-400/40 transition-all duration-300">
                      <Image
                        src="/pixel/link-pixelated.png"
                        alt="NFT"
                        height={48}
                        width={48}
                        className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 group-hover/icon:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 text-center">
                <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-blue-200 transition-all duration-300">
                  Use Existing NFT
                </h3>

                {/* Animated underline */}
                <div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mb-3 sm:mb-6 rounded-full opacity-60 group-hover:opacity-100 group-hover:w-16 sm:group-hover:w-24 group-hover:h-1 sm:group-hover:h-1.5 transition-all duration-500"></div>

                <p className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-3 sm:mb-6">
                  Create tokens from domain NFTs you already own
                </p>

                {/* Enhanced feature badge */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg sm:rounded-xl blur-sm group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/40 group-hover:border-blue-400/60 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl group-hover:bg-gradient-to-r group-hover:from-blue-900/60 group-hover:to-purple-900/60 transition-all duration-300">
                    <p className="text-xs sm:text-sm font-semibold text-blue-300 group-hover:text-blue-200 transition-colors duration-300 flex items-center gap-2 sm:gap-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:text-blue-300 transition-colors duration-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Quick & Easy - Skip to Token Creation</span>
                      <span className="sm:hidden">Quick & Easy</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-blue-400/40 rounded-full group-hover:bg-blue-400/80 group-hover:scale-150 transition-all duration-300"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-purple-400/40 rounded-full group-hover:bg-purple-400/80 group-hover:scale-125 transition-all duration-300 delay-75"></div>
            </GlassCard>
          </div>

          <div
            onClick={() => setMode('new-domain')}
            className="group relative cursor-pointer transform transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            <GlassCard className="relative p-4 sm:p-6 lg:p-8 h-full overflow-hidden border-2 border-green-500/30 hover:border-green-400/60 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/40">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-teal-500/5 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              {/* Floating orbs animation */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-green-400/20 to-teal-400/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-tr from-emerald-400/15 to-green-400/15 rounded-full blur-lg group-hover:scale-125 transition-transform duration-700 delay-100"></div>

              {/* Enhanced icon section */}
              <div className="relative mb-4 sm:mb-6 lg:mb-8 flex justify-center">
                <div className="relative group/icon">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 to-teal-500/30 rounded-lg sm:rounded-xl lg:rounded-2xl blur-lg sm:blur-xl group-hover:from-green-500/50 group-hover:to-teal-500/50 transition-all duration-500"></div>
                  <div className="relative p-3 sm:p-4 lg:p-6 bg-gradient-to-br from-green-500/20 via-teal-500/10 to-green-500/20 rounded-lg sm:rounded-xl lg:rounded-2xl backdrop-blur-sm border border-green-500/30 group-hover:border-green-400/50 transition-all duration-300 group-hover:scale-110">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-md sm:rounded-lg lg:rounded-xl bg-gradient-to-br from-green-500/30 to-teal-500/30 flex items-center justify-center group-hover:from-green-400/40 group-hover:to-teal-400/40 transition-all duration-300">
                      <img
                        src="/pixel/star-pixel.png"
                        alt="New"
                        className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 group-hover/icon:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 text-center">
                <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent group-hover:from-green-300 group-hover:to-green-200 transition-all duration-300">
                  Register New Domain
                </h3>

                {/* Animated underline */}
                <div className="w-12 sm:w-16 h-0.5 sm:h-1 bg-gradient-to-r from-green-400 to-teal-400 mx-auto mb-3 sm:mb-6 rounded-full opacity-60 group-hover:opacity-100 group-hover:w-16 sm:group-hover:w-24 group-hover:h-1 sm:group-hover:h-1.5 transition-all duration-500"></div>

                <p className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300 text-sm sm:text-base lg:text-lg leading-relaxed mb-3 sm:mb-6">
                  Complete flow from verification to token creation
                </p>

                {/* Enhanced feature badge */}
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-lg sm:rounded-xl blur-sm group-hover:from-green-500/30 group-hover:to-teal-500/30 transition-all duration-300"></div>
                  <div className="relative bg-gradient-to-r from-green-900/40 to-teal-900/40 border border-green-500/40 group-hover:border-green-400/60 p-2 sm:p-3 lg:p-4 rounded-lg sm:rounded-xl group-hover:bg-gradient-to-r group-hover:from-green-900/60 group-hover:to-teal-900/60 transition-all duration-300">
                    <p className="text-xs sm:text-sm font-semibold text-green-300 group-hover:text-green-200 transition-colors duration-300 flex items-center gap-2 sm:gap-3">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 group-hover:text-green-300 transition-colors duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="hidden sm:inline">Full Process - Verify, Register & Create</span>
                      <span className="sm:hidden">Full Process</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Corner accents */}
              <div className="absolute top-4 right-4 w-3 h-3 bg-green-400/40 rounded-full group-hover:bg-green-400/80 group-hover:scale-150 transition-all duration-300"></div>
              <div className="absolute bottom-4 left-4 w-2 h-2 bg-teal-400/40 rounded-full group-hover:bg-teal-400/80 group-hover:scale-125 transition-all duration-300 delay-75"></div>
            </GlassCard>
          </div>
        </div>
      </div>
    );
  }

  // Existing NFT flow
  if (mode === 'existing-nft') {
    return (
      <div className="space-y-3 sm:space-y-4 lg:space-y-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <button
            onClick={() => setMode('choose')}
            className="text-gray-400 hover:text-white flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm sm:text-base">Back to options</span>
          </button>
        </div>

        {currentStep === 6 && fromExistingNFT ? (
          <Step title="Create Token from NFT" completed={false} active={true}>
            <TokenCreationStep domain={registeredDomain} nftId={mintedNftId!} />
          </Step>
        ) : (
          <NFTSelectionStep onComplete={handleExistingNFTSelected} />
        )}
      </div>
    );
  }

  // New domain flow (starts at step 3, shows 1&2 only if issues)
  return (
    <div className="space-y-3 sm:space-y-4 lg:space-y-6">
      {mode === 'new-domain' && (
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <button
            onClick={() => setMode('choose')}
            className="text-gray-400 hover:text-white flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm sm:text-base">Back to options</span>
          </button>
        </div>
      )}

      {/* Only show steps 1 & 2 if there are issues */}
      {hasWalletIssue && (
        <Step
          title="Connect Your Wallet"
          completed={isConnected}
          active={!isConnected}
        >
          <div className="space-y-4">
            <p className="text-gray-300">
              Connect your wallet to start creating domain tokens.
            </p>
            <div className="flex justify-center mt-4">
              <WalletConnectButton />
            </div>
          </div>
        </Step>
      )}

      {hasBackendIssue && (
        <Step
          title="Backend Validation"
          completed={backendValidated}
          active={isConnected && !backendValidated}
        >
          <BackendValidationStep onComplete={handleBackendValidated} />
        </Step>
      )}

      {/* Main flow starts at step 3 */}
      {!hasWalletIssue && !hasBackendIssue && (
        <>
          <Step
            title="Verify Domain Ownership"
            completed={domainVerified}
            active={!domainVerified}
          >
            {domainVerified ? (
              <p className="text-green-400 flex items-center gap-2">
                <img src="/pixel/star-pixel.png" alt="Success" className="w-4 h-4" />
                Domain "{verifiedDomain}" ownership verified successfully!
              </p>
            ) : (
              <SafeDomainVerificationWrapper onComplete={handleDomainVerified} />
            )}
          </Step>

          <Step
            title="Register Domain"
            completed={currentStep > 4}
            active={domainVerified && currentStep === 4}
          >
            {!domainVerified ? (
              <p className="text-gray-400">Complete previous step to proceed</p>
            ) : currentStep > 4 ? (
              <p className="text-green-400 flex items-center gap-2">
                <img src="/pixel/star-pixel.png" alt="Success" className="w-4 h-4" />
                Domain "{registeredDomain}" registered successfully!
              </p>
            ) : (
              <DomainRegistrationStep domain={verifiedDomain} onComplete={handleDomainRegistered} />
            )}
          </Step>

          <Step
            title="Mint Domain NFT"
            completed={currentStep > 5}
            active={currentStep === 5}
          >
            {currentStep < 5 ? (
              <p className="text-gray-400">Complete previous steps to proceed</p>
            ) : currentStep > 5 ? (
              <p className="text-green-400 flex items-center gap-2">
                <img src="/pixel/game-pixel.png" alt="NFT" className="w-4 h-4" />
                NFT #{mintedNftId} minted successfully!
              </p>
            ) : (
              <NFTMintingStep domain={registeredDomain} onComplete={handleNFTMinted} />
            )}
          </Step>

          <Step
            title="Create Domain Token"
            completed={false}
            active={currentStep === 6}
          >
            {currentStep < 6 ? (
              <p className="text-gray-400">Complete previous steps to proceed</p>
            ) : (
              <TokenCreationStep domain={registeredDomain} nftId={mintedNftId!} />
            )}
          </Step>
        </>
      )}
    </div>
  );
};

export default function CreateTokenPage() {
  const [isClient, setIsClient] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-slate-900 via-slate-900/20 to-black overflow-hidden">
      {/* Interactive 3D Background */}
      <InteractiveBackground />

      {/* Static gradient overlay for depth and readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-black/60 pointer-events-none z-10"></div>

      {/* Animated background glows - adjusted for mobile */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-10 sm:top-20 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-gradient-to-r from-blue-900/40 via-indigo-800/50 to-purple-900/45 rounded-full blur-2xl sm:blur-3xl animate-pulse opacity-50" style={{ animationDuration: '6.5s' }}></div>
        <div className="absolute top-20 sm:top-40 right-1/5 w-36 sm:w-72 h-36 sm:h-72 bg-gradient-to-l from-teal-900/35 via-cyan-800/45 to-blue-900/40 rounded-full blur-xl sm:blur-2xl animate-pulse opacity-45" style={{ animationDuration: '5.8s', animationDelay: '1s' }}></div>
        <div className="absolute top-32 sm:top-60 left-1/2 transform -translate-x-1/2 w-64 sm:w-[400px] h-48 sm:h-[300px] bg-gradient-to-br from-purple-900/45 via-blue-800/55 to-indigo-900/50 rounded-full blur-2xl sm:blur-3xl animate-pulse opacity-55" style={{ animationDuration: '7.5s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 sm:bottom-40 left-5 sm:left-10 w-32 sm:w-64 h-32 sm:h-64 bg-gradient-to-tr from-cyan-900/30 via-blue-800/40 to-teal-900/35 rounded-full blur-xl sm:blur-2xl animate-pulse opacity-40" style={{ animationDuration: '5.3s', animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-10 sm:bottom-20 right-5 sm:right-10 w-38 sm:w-76 h-38 sm:h-76 bg-gradient-to-bl from-indigo-900/35 via-purple-800/45 to-blue-900/40 rounded-full blur-2xl sm:blur-3xl animate-pulse opacity-45" style={{ animationDuration: '6.2s', animationDelay: '3s' }}></div>
      </div>

      <main className="relative z-20 flex-grow container mx-auto px-4 py-6 sm:py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            {/* Mobile-optimized heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 lg:mb-6 relative py-2 sm:py-4 lg:py-6">
              <span className="relative z-10 leading-tight">
                <span className="block sm:inline">Create Domain</span>
                <span className="block sm:inline sm:ml-3">Token</span>
              </span>
              <AnimatedHeadingGlow 
                color="#8B5CF6" 
                intensity={0.25} 
                speed={0.9} 
                distortionAmount={0.7}
                size={0.6}
                randomSeed={0.8}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-teal-400 bg-clip-text text-transparent blur-sm opacity-30"></div>
            </h1>
            
            {/* Mobile-optimized description */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-3xl mx-auto mb-4 sm:mb-6 lg:mb-8 leading-relaxed px-2">
              Transform your domain into a tradeable token. Choose to register a new domain or use an existing domain NFT to create tokens for trading.
            </p>

            {/* Mobile-optimized button */}
            <div className="relative group inline-block">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-xl sm:rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-all duration-500 animate-pulse"></div>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="relative bg-slate-800/80 hover:bg-slate-700/80 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-base sm:text-lg lg:text-xl font-bold rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-4xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 backdrop-blur-sm group-hover:shadow-purple-500/40"
                style={{
                  borderImage: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #06b6d4) 1',
                  background: 'linear-gradient(45deg, #3b82f644, #8b5cf644, #06b6d444) border-box, rgba(30, 41, 59, 0.8) '
                }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-purple-400/10 to-cyan-400/0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Button>
            </div>
          </div>

          {/* Mobile-optimized Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="relative group transform transition-all duration-500 hover:scale-[1.02] sm:hover:scale-[1.03]">
              <GlassCard className="relative p-3 sm:p-4 lg:p-6 text-center h-full overflow-hidden border-2 border-blue-500/20 hover:border-blue-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/30">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/3 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Floating particles - hidden on mobile for performance */}
                <div className="hidden sm:block absolute top-4 right-6 w-2 h-2 bg-blue-400/40 rounded-full group-hover:animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="hidden sm:block absolute top-8 right-4 w-1.5 h-1.5 bg-indigo-400/30 rounded-full group-hover:animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="hidden sm:block absolute bottom-6 left-4 w-1 h-1 bg-blue-300/40 rounded-full group-hover:animate-bounce" style={{ animationDelay: '0.4s' }}></div>

                <div className="relative z-10">
                  {/* Mobile-optimized icon */}
                  <div className="mb-3 sm:mb-4 lg:mb-6 flex justify-center">
                    <div className="relative group/icon">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/40 to-indigo-500/40 rounded-lg sm:rounded-xl blur-sm sm:blur-md group-hover:from-blue-500/60 group-hover:to-indigo-500/60 transition-all duration-500"></div>
                      <div className="relative p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-blue-500/15 via-indigo-500/10 to-blue-500/15 rounded-lg sm:rounded-xl backdrop-blur-sm border border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300 group-hover:scale-110">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-md sm:rounded-lg bg-gradient-to-br from-blue-500/25 to-indigo-500/25 flex items-center justify-center group-hover:from-blue-400/35 group-hover:to-indigo-400/35 transition-all duration-300">
                          <img
                            src="/pixel/link-pixelated.png"
                            alt="NFT"
                            className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 group-hover/icon:scale-110 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:to-indigo-300 transition-all duration-300">
                    Use Existing NFT
                  </h3>

                  {/* Animated underline */}
                  <div className="w-6 sm:w-8 lg:w-10 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 mx-auto mb-2 sm:mb-3 rounded-full opacity-50 group-hover:opacity-100 group-hover:w-8 sm:group-hover:w-10 lg:group-hover:w-12 transition-all duration-300"></div>

                  <p className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300 leading-relaxed text-xs sm:text-sm">
                    Create tokens from domain NFTs you already own - quick and easy!
                  </p>
                </div>

                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-bl from-blue-400/10 to-transparent rounded-tl-2xl sm:rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </GlassCard>
            </div>

            <div className="relative group transform transition-all duration-500 hover:scale-[1.02] sm:hover:scale-[1.03]">
              <GlassCard className="relative p-3 sm:p-4 lg:p-6 text-center h-full overflow-hidden border-2 border-green-500/20 hover:border-green-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/30">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-teal-500/3 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Floating particles - hidden on mobile for performance */}
                <div className="hidden sm:block absolute top-4 right-6 w-2 h-2 bg-green-400/40 rounded-full group-hover:animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="hidden sm:block absolute top-8 right-4 w-1.5 h-1.5 bg-teal-400/30 rounded-full group-hover:animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                <div className="hidden sm:block absolute bottom-6 left-4 w-1 h-1 bg-green-300/40 rounded-full group-hover:animate-bounce" style={{ animationDelay: '0.5s' }}></div>

                <div className="relative z-10">
                  {/* Mobile-optimized icon */}
                  <div className="mb-3 sm:mb-4 lg:mb-6 flex justify-center">
                    <div className="relative group/icon">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/40 to-teal-500/40 rounded-lg sm:rounded-xl blur-sm sm:blur-md group-hover:from-green-500/60 group-hover:to-teal-500/60 transition-all duration-500"></div>
                      <div className="relative p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-green-500/15 via-teal-500/10 to-green-500/15 rounded-lg sm:rounded-xl backdrop-blur-sm border border-green-500/30 group-hover:border-green-400/50 transition-all duration-300 group-hover:scale-110">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-md sm:rounded-lg bg-gradient-to-br from-green-500/25 to-teal-500/25 flex items-center justify-center group-hover:from-green-400/35 group-hover:to-teal-400/35 transition-all duration-300">
                          <img
                            src="/pixel/star-pixel.png"
                            alt="New"
                            className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 group-hover/icon:scale-110 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent group-hover:from-green-300 group-hover:to-teal-300 transition-all duration-300">
                    Register New Domain
                  </h3>

                  {/* Animated underline */}
                  <div className="w-6 sm:w-8 lg:w-10 h-0.5 bg-gradient-to-r from-green-400 to-teal-400 mx-auto mb-2 sm:mb-3 rounded-full opacity-50 group-hover:opacity-100 group-hover:w-8 sm:group-hover:w-10 lg:group-hover:w-12 transition-all duration-300"></div>

                  <p className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300 leading-relaxed text-xs sm:text-sm">
                    Full process from domain verification to token creation.
                  </p>
                </div>

                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-bl from-green-400/10 to-transparent rounded-tl-2xl sm:rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </GlassCard>
            </div>

            <div className="relative group transform transition-all duration-500 hover:scale-[1.02] sm:hover:scale-[1.03] sm:col-span-2 lg:col-span-1">
              <GlassCard className="relative p-3 sm:p-4 lg:p-6 text-center h-full overflow-hidden border-2 border-purple-500/20 hover:border-purple-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/30">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/3 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* Floating particles - hidden on mobile for performance */}
                <div className="hidden sm:block absolute top-4 right-6 w-2 h-2 bg-purple-400/40 rounded-full group-hover:animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="hidden sm:block absolute top-8 right-4 w-1.5 h-1.5 bg-pink-400/30 rounded-full group-hover:animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                <div className="hidden sm:block absolute bottom-6 left-4 w-1 h-1 bg-purple-300/40 rounded-full group-hover:animate-bounce" style={{ animationDelay: '0.6s' }}></div>

                <div className="relative z-10">
                  {/* Mobile-optimized icon */}
                  <div className="mb-3 sm:mb-4 lg:mb-6 flex justify-center">
                    <div className="relative group/icon">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/40 to-pink-500/40 rounded-lg sm:rounded-xl blur-sm sm:blur-md group-hover:from-purple-500/60 group-hover:to-pink-500/60 transition-all duration-500"></div>
                      <div className="relative p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-purple-500/15 rounded-lg sm:rounded-xl backdrop-blur-sm border border-purple-500/30 group-hover:border-purple-400/50 transition-all duration-300 group-hover:scale-110">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-md sm:rounded-lg bg-gradient-to-br from-purple-500/25 to-pink-500/25 flex items-center justify-center group-hover:from-purple-400/35 group-hover:to-pink-400/35 transition-all duration-300">
                          <img
                            src="/pixel/rocket-pixel.png"
                            alt="Launch"
                            className="w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 group-hover/icon:scale-110 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-pink-300 transition-all duration-300">
                    Launch & Trade
                  </h3>

                  {/* Animated underline */}
                  <div className="w-6 sm:w-8 lg:w-10 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mb-2 sm:mb-3 rounded-full opacity-50 group-hover:opacity-100 group-hover:w-8 sm:group-hover:w-10 lg:group-hover:w-12 transition-all duration-300"></div>

                  <p className="text-gray-300 group-hover:text-gray-100 transition-colors duration-300 leading-relaxed text-xs sm:text-sm">
                    Choose direct receipt or launchpad for your tokens.
                  </p>
                </div>

                {/* Corner glow */}
                <div className="absolute top-0 right-0 w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-bl from-purple-400/10 to-transparent rounded-tl-2xl sm:rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </GlassCard>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreateTokenContent />
      </Modal>
    </div>
  );
}
