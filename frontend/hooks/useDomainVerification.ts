import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import config from '@/lib/config';

interface DomainVerificationResult {
  domainName: string;
  walletAddress: string;
  isVerified: boolean;
}

interface DomainVerificationError {
  message: string;
  type: 'auth_error' | 'network_error' | 'dns_error' | 'validation_error' | 'unknown_error';
  requiresReauth?: boolean;
  status?: number;
}

export function useDomainVerification() {
  const { address, isConnected } = useAccount();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<DomainVerificationError | null>(null);

  const verifyDomain = useCallback(async (
    domainName: string, 
    walletAddress?: string
  ): Promise<DomainVerificationResult> => {
    if (!isConnected || !address) {
      const authError: DomainVerificationError = {
        message: 'Please connect your wallet to verify domain ownership',
        type: 'auth_error',
        requiresReauth: true
      };
      setError(authError);
      throw authError;
    }

    const targetWallet = walletAddress || address;
    if (!targetWallet) {
      const validationError: DomainVerificationError = {
        message: 'No wallet address provided for verification',
        type: 'validation_error'
      };
      setError(validationError);
      throw validationError;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(
        `${config.apiUrl}/domains/${domainName}/${targetWallet}/verify`,
        { 
          method: 'GET'
        }
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: 'Failed to parse error response' };
        }

        // Create structured error based on status code
        let domainError: DomainVerificationError;
        
        if (response.status === 401) {
          domainError = {
            message: 'Wallet not connected. Please connect your wallet to continue.',
            type: 'auth_error',
            requiresReauth: true,
            status: response.status
          };
        } else if (response.status === 403) {
          domainError = {
            message: 'Access denied. Make sure you are verifying with the correct wallet.',
            type: 'auth_error',
            status: response.status
          };
        } else if (response.status >= 500) {
          domainError = {
            message: 'Server error. Please try again later.',
            type: 'network_error',
            status: response.status
          };
        } else {
          domainError = {
            message: errorData.error || 'Domain verification failed',
            type: 'dns_error',
            status: response.status
          };
        }

        setError(domainError);
        throw domainError;
      }

      const data = await response.json();
      
      if (!data.success) {
        const dnsError: DomainVerificationError = {
          message: data.error || 'Domain verification failed. Please check your DNS TXT record.',
          type: 'dns_error'
        };
        setError(dnsError);
        throw dnsError;
      }

      return data.data;
    } catch (err) {
      console.log('useDomainVerification caught error:', err);
      console.log('Error type:', typeof err);
      console.log('Error constructor:', err?.constructor?.name);
      
      // If it's already a DomainVerificationError, re-throw it
      if (err && typeof err === 'object' && 'type' in err) {
        console.log('Re-throwing structured error:', err);
        setError(err as DomainVerificationError);
        throw err;
      }

      // Handle network/fetch errors
      const networkError: DomainVerificationError = {
        message: err instanceof Error ? err.message : 'Unknown error occurred',
        type: 'network_error'
      };
      console.log('Creating network error:', networkError);
      setError(networkError);
      throw networkError;
    } finally {
      setIsVerifying(false);
    }
  }, [address, isConnected]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    verifyDomain,
    isVerifying,
    error,
    clearError,
    canVerify: isConnected && !!address,
  };
}

export type { DomainVerificationError, DomainVerificationResult }; 