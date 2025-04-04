"use client";

import { useState, useEffect } from 'react';
import { useStorageContract } from '@/hooks/useStorageContract';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/GlassCard';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function StorageInterface() {
  const [inputValue, setInputValue] = useState<string>('');
  const { storedValue, isLoadingValue, storeValue, isStoring, isConfirmed, refreshData, transactionCompleted } = useStorageContract();
  const { isConnected, isCorrectNetwork, switchToSepolia } = useWalletConnection();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numValue = parseInt(inputValue);
    if (isNaN(numValue)) {
      alert('Please enter a valid number');
      return;
    }
    
    const success = await storeValue(numValue);
    if (success) {
      setInputValue('');
      // Auto-refresh happens via hook
    }
  };

  // Client-side only rendering
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Render content based on connection state
  const renderContent = () => {
    // Return a common placeholder during server rendering
    if (!isMounted) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">Loading...</p>
        </div>
      );
    }
    
    if (!isConnected) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">Please connect your wallet to interact with the contract</p>
        </div>
      );
    }
    
    if (!isCorrectNetwork) {
      return (
        <div className="text-center p-6">
          <p className="mb-4">Please switch to the Sepolia network</p>
          <Button onClick={switchToSepolia}>Switch to Sepolia</Button>
        </div>
      );
    }
    
    return (
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-medium">Current Value:</h3>
            <div className="text-3xl font-bold">
              {isLoadingValue ? 'Loading...' : storedValue?.toString() || '0'}
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="newValue" className="text-sm font-medium">
              New Value:
            </label>
            <Input
              id="newValue"
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter a new value"
              disabled={isStoring}
              className="text-white"
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            type="submit" 
            disabled={isStoring || !inputValue}
            className="w-full bg-primary hover:!bg-primary hover:brightness-90"
          >
            {isStoring ? 'Storing...' : 'Store Value'}
          </Button>
        </CardFooter>
        
        {isConfirmed && (
          <div className="p-4 text-green-300 rounded mt-4 text-center">
            Transaction confirmed! Value has been updated.
          </div>
        )}
      </form>
    );
  };

  const content = renderContent();
  
  return (
    <GlassCard className="max-w-md w-full mx-auto">
      <CardHeader>
        <CardTitle>Simple Storage Contract</CardTitle>
        <CardDescription>
          Store and retrieve a value on the Sepolia testnet
        </CardDescription>
      </CardHeader>
      {content}
    </GlassCard>
  );
}
