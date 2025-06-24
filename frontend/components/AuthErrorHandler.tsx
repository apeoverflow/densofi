"use client";

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AuthErrorHandlerProps {
  error?: string | Error | null;
  onErrorCleared?: () => void;
  className?: string;
}

export function AuthErrorHandler({ error, onErrorCleared, className }: AuthErrorHandlerProps) {
  const { resetAuth } = useWalletAuth();
  const [isAuthError, setIsAuthError] = useState(false);

  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAuthenticationError = 
        errorMessage.toLowerCase().includes('wallet authentication required') ||
        errorMessage.toLowerCase().includes('authentication required') ||
        errorMessage.toLowerCase().includes('wallet not authenticated') ||
        errorMessage.toLowerCase().includes('authentication expired') ||
        errorMessage.toLowerCase().includes('session expired');
      
      setIsAuthError(isAuthenticationError);
    } else {
      setIsAuthError(false);
    }
  }, [error]);

  const handleResetAuth = () => {
    onErrorCleared?.();
    resetAuth();
  };

  if (!error || !isAuthError) {
    return null;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    <div className={className}>
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium mb-1">Authentication Error</div>
            <div className="text-sm">{errorMessage}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAuth}
            className="ml-3 text-xs bg-red-600/20 hover:bg-red-600/30 border-red-500/50 whitespace-nowrap"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Reset Auth
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Hook to automatically detect and handle authentication errors
export function useAuthErrorHandler(error?: string | Error | null) {
  const { resetAuth } = useWalletAuth();
  const [isAuthError, setIsAuthError] = useState(false);

  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAuthenticationError = 
        errorMessage.toLowerCase().includes('wallet authentication required') ||
        errorMessage.toLowerCase().includes('authentication required') ||
        errorMessage.toLowerCase().includes('wallet not authenticated') ||
        errorMessage.toLowerCase().includes('authentication expired') ||
        errorMessage.toLowerCase().includes('session expired');
      
      setIsAuthError(isAuthenticationError);
    } else {
      setIsAuthError(false);
    }
  }, [error]);

  const handleResetAuth = () => {
    resetAuth();
  };

  return {
    isAuthError,
    resetAuth: handleResetAuth,
  };
} 