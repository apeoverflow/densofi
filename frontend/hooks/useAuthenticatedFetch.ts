import { useCallback } from 'react';
import { useWalletAuth } from './useWalletAuth';
import { useAccount } from 'wagmi';

import config from '@/lib/config';

const BACKEND_SERVICE_URL = config.apiBaseUrl;

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export function useAuthenticatedFetch() {
  const { getAuthHeaders, isAuthenticated } = useWalletAuth();
  const { address } = useAccount();

  const authenticatedFetch = useCallback(async (
    url: string, 
    options: FetchOptions = {}
  ) => {
    const { requireAuth = false, headers = {}, ...restOptions } = options;
    
    // Check if authentication is required but not available
    if (requireAuth && !isAuthenticated) {
      throw new Error('Authentication required but wallet is not authenticated');
    }

    // Prepare headers
    const authHeaders = isAuthenticated ? getAuthHeaders() : {};
    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(headers as Record<string, string>),
    };
    
    // Add wallet address header for authenticated requests
    if (isAuthenticated && address) {
      finalHeaders['X-Wallet-Address'] = address.toLowerCase();
    }
    
    // Only add auth headers if they have values
    Object.entries(authHeaders).forEach(([key, value]) => {
      if (value) {
        finalHeaders[key] = value;
      }
    });

    // Make the request
    const fullUrl = url.startsWith('http') ? url : `${BACKEND_SERVICE_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      ...restOptions,
      headers: finalHeaders,
    });

    return response;
  }, [getAuthHeaders, isAuthenticated, address]);

  return authenticatedFetch;
} 