import { useState, useEffect } from 'react';
import { useAuthenticatedFetch } from './useAuthenticatedFetch';

export interface Token {
  id: string;
  name: string;
  contractAddress: string;
  ownerAddress: string;
  chainId: string;
  nftTokenId: number;
  expirationDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
  currentPrice: number;
  change24h: number;
  totalLiquidity: number;
  volume24h: number;
  isActive: boolean;
}

export interface DetailedToken extends Token {
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  registrationDate?: Date;
  subdomainCount: number;
}

export interface TokensResponse {
  success: boolean;
  data: Token[];
  count: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  loadTime?: string;
  error?: string;
}

export interface TokenResponse {
  success: boolean;
  data: DetailedToken;
  error?: string;
}

export function useTokens(page: number = 1, limit: number = 20) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TokensResponse['pagination'] | null>(null);
  const [loadTime, setLoadTime] = useState<string>('');
  const authenticatedFetch = useAuthenticatedFetch();

  const fetchTokens = async (pageNum: number = page) => {
    try {
      setLoading(true);
      setError(null);

      const startTime = Date.now();
      const response = await authenticatedFetch(`/api/tokens?page=${pageNum}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tokens: ${response.statusText}`);
      }

      const result: TokensResponse = await response.json();
      
      if (result.success) {
        setTokens(result.data);
        setPagination(result.pagination || null);
        setLoadTime(result.loadTime || `${Date.now() - startTime}ms`);
      } else {
        throw new Error(result.error || 'Failed to fetch tokens');
      }
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens(page);
  }, [page, limit, authenticatedFetch]);

  return { 
    tokens, 
    loading, 
    error, 
    pagination,
    loadTime,
    refetch: () => fetchTokens(page),
    loadPage: (newPage: number) => fetchTokens(newPage)
  };
}

export function useToken(tokenName: string) {
  const [token, setToken] = useState<DetailedToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authenticatedFetch = useAuthenticatedFetch();

  useEffect(() => {
    const fetchToken = async () => {
      if (!tokenName) return;

      try {
        setLoading(true);
        setError(null);

        const response = await authenticatedFetch(`/api/tokens/${encodeURIComponent(tokenName)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Token not found');
          }
          throw new Error(`Failed to fetch token: ${response.statusText}`);
        }

        const result: TokenResponse = await response.json();
        
        if (result.success) {
          setToken(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch token');
        }
      } catch (err) {
        console.error('Error fetching token:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch token');
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, [tokenName, authenticatedFetch]);

  return { token, loading, error, refetch: () => window.location.reload() };
}
