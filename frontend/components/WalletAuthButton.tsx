"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { WalletConnectButton } from './WalletConnectButton';
import { CheckCircle, Shield, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WalletAuthButtonProps {
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
  className?: string;
}

export function WalletAuthButton({ 
  onAuthSuccess, 
  onAuthError,
  className 
}: WalletAuthButtonProps) {
  const {
    isAuthenticated,
    isLoading,
    error,
    needsAuthentication,
    isWalletConnected,
    connectedAddress,
    authenticate,
    logout,
    resetAuth,
  } = useWalletAuth();

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      await authenticate();
      onAuthSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      onAuthError?.(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleResetAuth = () => {
    resetAuth();
  };

  // Show wallet connect button if wallet is not connected
  if (!isWalletConnected) {
    return (
      <div className={className}>
        <WalletConnectButton />
      </div>
    );
  }

  // Show authentication status if authenticated
  if (isAuthenticated) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle size={20} />
          <span className="text-sm font-medium">Authenticated</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="text-xs"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  // Show authenticate button if wallet is connected but not authenticated
  if (needsAuthentication) {
    return (
      <div className={`space-y-3 ${className}`}>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetAuth}
                className="ml-3 text-xs bg-red-600/20 hover:bg-red-600/30 border-red-500/50"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Reset Auth
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Button
          onClick={handleAuthenticate}
          disabled={isLoading || isAuthenticating}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {(isLoading || isAuthenticating) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Authenticate Wallet
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-600">
          Sign a message to verify wallet ownership
        </p>
      </div>
    );
  }

  // Loading state
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Checking authentication...</span>
    </div>
  );
} 