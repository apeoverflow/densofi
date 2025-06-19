import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

const BACKEND_SERVICE_URL = process.env.NEXT_PUBLIC_BACKEND_SERVICE_URL || 'http://localhost:8000';

interface AuthMessage {
  message: string;
  nonce: string;
  expiresAt: string;
}

interface AuthResult {
  walletAddress: string;
  isVerified: boolean;
  sessionId: string;
  expiresAt: string;
}

interface WalletAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  walletAddress: string | null;
  expiresAt: string | null;
}

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  
  const [authState, setAuthState] = useState<WalletAuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    sessionId: null,
    walletAddress: null,
    expiresAt: null,
  });

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedAuth = localStorage.getItem('wallet-auth');
        if (storedAuth) {
          const parsed = JSON.parse(storedAuth);
          
          // Check if the session is still valid and matches current wallet
          if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date() && 
              parsed.walletAddress === address?.toLowerCase()) {
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              error: null,
              sessionId: parsed.sessionId,
              walletAddress: parsed.walletAddress,
              expiresAt: parsed.expiresAt,
            });
          } else {
            // Clear expired or mismatched session
            localStorage.removeItem('wallet-auth');
          }
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('wallet-auth');
      }
    };

    loadAuthState();
  }, [address]);

  // Clear auth state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        error: null,
        sessionId: null,
        walletAddress: null,
        expiresAt: null,
      });
      localStorage.removeItem('wallet-auth');
    }
  }, [isConnected]);

  const requestAuthMessage = useCallback(async (): Promise<AuthMessage> => {
    const response = await fetch(`${BACKEND_SERVICE_URL}/api/auth/request-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to request authentication message');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to generate auth message');
    }

    return data.data;
  }, []);

  const verifySignature = useCallback(async (
    nonce: string, 
    signature: string, 
    walletAddress: string
  ): Promise<AuthResult> => {
    const response = await fetch(`${BACKEND_SERVICE_URL}/api/auth/verify-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nonce,
        signature,
        walletAddress: walletAddress.toLowerCase(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify signature');
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to verify signature');
    }

    return data.data;
  }, []);

  const authenticate = useCallback(async (): Promise<void> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }

    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Step 1: Request authentication message
      const authMessage = await requestAuthMessage();

      // Step 2: Sign the message with the wallet
      const signature = await signMessageAsync({
        message: authMessage.message,
      });

      // Step 3: Verify the signature with backend
      const authResult = await verifySignature(
        authMessage.nonce,
        signature,
        address
      );

      // Step 4: Store authentication state
      const newAuthState = {
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionId: authResult.sessionId,
        walletAddress: authResult.walletAddress,
        expiresAt: authResult.expiresAt,
      };

      setAuthState(newAuthState);

      // Persist to localStorage
      localStorage.setItem('wallet-auth', JSON.stringify({
        sessionId: authResult.sessionId,
        walletAddress: authResult.walletAddress,
        expiresAt: authResult.expiresAt,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      }));
      throw error;
    }
  }, [address, isConnected, signMessageAsync, requestAuthMessage, verifySignature]);

  const logout = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionId: null,
      walletAddress: null,
      expiresAt: null,
    });
    localStorage.removeItem('wallet-auth');
  }, []);

  const getAuthHeaders = useCallback(() => {
    if (!authState.sessionId) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${authState.sessionId}`,
    };
  }, [authState.sessionId]);

  // Check if authentication is required based on wallet connection and current auth state
  const needsAuthentication = isConnected && !authState.isAuthenticated && !authState.isLoading;

  return {
    ...authState,
    authenticate,
    logout,
    getAuthHeaders,
    needsAuthentication,
    isWalletConnected: isConnected,
    connectedAddress: address,
  };
} 