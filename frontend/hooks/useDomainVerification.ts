import { useState, useCallback } from 'react';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';
import { useWalletAuth } from './useWalletAuth';

interface DomainVerificationResult {
  domainName: string;
  walletAddress: string;
  isVerified: boolean;
  authenticatedWallet: string | null;
  authType: 'admin' | 'wallet';
  adminOverride: boolean;
}

export function useDomainVerification() {
  const { isAuthenticated, connectedAddress } = useWalletAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyDomain = useCallback(async (
    domainName: string, 
    walletAddress?: string
  ): Promise<DomainVerificationResult> => {
    if (!isAuthenticated) {
      throw new Error('Wallet authentication required');
    }

    const targetWallet = walletAddress || connectedAddress;
    if (!targetWallet) {
      throw new Error('No wallet address provided');
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        `/api/domains/${domainName}/${targetWallet}/verify`,
        { 
          requireAuth: true,
          method: 'GET'
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Domain verification failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Domain verification failed');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsVerifying(false);
    }
  }, [isAuthenticated, connectedAddress, authenticatedFetch]);

  return {
    verifyDomain,
    isVerifying,
    error,
    canVerify: isAuthenticated && !!connectedAddress,
  };
} 