import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

import config from '@/lib/config';

const BACKEND_SERVICE_URL = config.apiBaseUrl;

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

  // Load authentication state from localStorage on mount and when address changes
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedAuth = localStorage.getItem('wallet-auth');
        console.log('Loading auth state:', { 
          hasStoredAuth: !!storedAuth, 
          address: address?.toLowerCase(),
          isConnected 
        });
        
        if (storedAuth && address) {
          const parsed = JSON.parse(storedAuth);
          
          // Check if the session is still valid and matches current wallet
          const isExpired = !parsed.expiresAt || new Date(parsed.expiresAt) <= new Date();
          const addressMatches = parsed.walletAddress === address?.toLowerCase();
          
          console.log('Auth state check:', {
            isExpired,
            addressMatches,
            storedAddress: parsed.walletAddress,
            currentAddress: address?.toLowerCase(),
            expiresAt: parsed.expiresAt
          });
          
          if (!isExpired && addressMatches) {
            console.log('Restoring auth state from localStorage');
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
            if (isExpired) {
              console.log('Clearing expired auth session');
            } else if (!addressMatches) {
              console.log('Clearing auth session - wallet address mismatch:', {
                stored: parsed.walletAddress,
                current: address?.toLowerCase()
              });
            }
            localStorage.removeItem('wallet-auth');
            setAuthState({
              isAuthenticated: false,
              isLoading: false,
              error: null,
              sessionId: null,
              walletAddress: null,
              expiresAt: null,
            });
          }
        } else if (storedAuth && !address) {
          // Wallet disconnected but stored auth exists
          console.log('Wallet disconnected but stored auth exists, clearing...');
          localStorage.removeItem('wallet-auth');
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            error: null,
            sessionId: null,
            walletAddress: null,
            expiresAt: null,
          });
        } else if (!storedAuth && (authState.isAuthenticated || authState.sessionId)) {
          // No stored auth but state shows authenticated - clear state
          console.log('No stored auth found but state shows authenticated, clearing auth state');
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            error: null,
            sessionId: null,
            walletAddress: null,
            expiresAt: null,
          });
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        localStorage.removeItem('wallet-auth');
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: null,
          sessionId: null,
          walletAddress: null,
          expiresAt: null,
        });
      }
    };

    loadAuthState();
  }, [address, isConnected]);

  // Clear auth state when wallet disconnects
  useEffect(() => {
    if (!isConnected) {
      console.log('Wallet disconnected, clearing auth state');
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

  // Additional check for wallet address changes while authenticated
  useEffect(() => {
    if (isConnected && address && authState.isAuthenticated && authState.walletAddress) {
      const currentAddress = address.toLowerCase();
      const authenticatedAddress = authState.walletAddress.toLowerCase();
      
      if (currentAddress !== authenticatedAddress) {
        console.log('Wallet address changed while authenticated, clearing session:', {
          previous: authenticatedAddress,
          current: currentAddress
        });
        
        // Clear authentication state immediately
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          error: 'Wallet changed - please re-authenticate',
          sessionId: null,
          walletAddress: null,
          expiresAt: null,
        });
        localStorage.removeItem('wallet-auth');
      }
    }
  }, [address, isConnected, authState.isAuthenticated, authState.walletAddress]);

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

      console.log('Setting new auth state:', newAuthState);
      setAuthState(newAuthState);

      // Persist to localStorage
      localStorage.setItem('wallet-auth', JSON.stringify({
        sessionId: authResult.sessionId,
        walletAddress: authResult.walletAddress,
        expiresAt: authResult.expiresAt,
      }));

      // Force refresh auth state after a short delay to ensure all components sync
      setTimeout(() => {
        console.log('Auto-refreshing auth state after authentication...');
        const storedAuth = localStorage.getItem('wallet-auth');
        if (storedAuth && address) {
          try {
            const parsed = JSON.parse(storedAuth);
            const isExpired = !parsed.expiresAt || new Date(parsed.expiresAt) <= new Date();
            const addressMatches = parsed.walletAddress === address?.toLowerCase();
            
            if (!isExpired && addressMatches) {
              console.log('Auto-refresh: Setting auth state to authenticated');
              setAuthState({
                isAuthenticated: true,
                isLoading: false,
                error: null,
                sessionId: parsed.sessionId,
                walletAddress: parsed.walletAddress,
                expiresAt: parsed.expiresAt,
              });
              
              // Trigger page refresh after successful authentication
              console.log('Authentication successful - refreshing page...');
              console.log('test');
              window.location.reload();
            }
          } catch (error) {
            console.error('Error in auto-refresh:', error);
          }
        }
      }, 500); // 500ms delay to ensure state propagation

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

  const resetAuth = useCallback(() => {
    console.log('Resetting wallet authentication...');
    
    // Clear all auth-related localStorage items
    localStorage.removeItem('wallet-auth');
    
    // Reset auth state
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      error: null,
      sessionId: null,
      walletAddress: null,
      expiresAt: null,
    });
    
    // Refresh the page to ensure clean state
    window.location.reload();
  }, []);

  const forceRefreshAuthState = useCallback(() => {
    console.log('Force refreshing auth state...');
    const storedAuth = localStorage.getItem('wallet-auth');
    console.log('Current stored auth:', storedAuth);
    console.log('Current address:', address);
    console.log('Current auth state:', authState);
    
    if (storedAuth && address) {
      try {
        const parsed = JSON.parse(storedAuth);
        const isExpired = !parsed.expiresAt || new Date(parsed.expiresAt) <= new Date();
        const addressMatches = parsed.walletAddress === address?.toLowerCase();
        
        if (!isExpired && addressMatches) {
          console.log('Force setting auth state to authenticated');
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            error: null,
            sessionId: parsed.sessionId,
            walletAddress: parsed.walletAddress,
            expiresAt: parsed.expiresAt,
          });
        }
      } catch (error) {
        console.error('Error in force refresh:', error);
      }
    }
  }, [address, authState]);

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
    resetAuth,
    forceRefreshAuthState,
    getAuthHeaders,
    needsAuthentication,
    isWalletConnected: isConnected,
    connectedAddress: address,
  };
} 