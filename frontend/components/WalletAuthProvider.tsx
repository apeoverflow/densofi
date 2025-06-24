"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useWalletAuth } from '@/hooks/useWalletAuth';

interface WalletAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionId: string | null;
  walletAddress: string | null;
  expiresAt: string | null;
  authenticate: () => Promise<void>;
  logout: () => void;
  resetAuth: () => void;
  getAuthHeaders: () => Record<string, string> | {};
  needsAuthentication: boolean;
  isWalletConnected: boolean;
  connectedAddress: string | undefined;
}

const WalletAuthContext = createContext<WalletAuthContextType | null>(null);

interface WalletAuthProviderProps {
  children: ReactNode;
}

export function WalletAuthProvider({ children }: WalletAuthProviderProps) {
  const authState = useWalletAuth();

  return (
    <WalletAuthContext.Provider value={authState}>
      {children}
    </WalletAuthContext.Provider>
  );
}

export function useWalletAuthContext() {
  const context = useContext(WalletAuthContext);
  if (!context) {
    throw new Error('useWalletAuthContext must be used within a WalletAuthProvider');
  }
  return context;
} 