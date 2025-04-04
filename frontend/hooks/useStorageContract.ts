import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '@/constants/contract';
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for interacting with the Simple Storage contract
 */
export function useStorageContract() {
  const [isStoring, setIsStoring] = useState(false);
  const [transactionCompleted, setTransactionCompleted] = useState(false);
  
  // Read the current stored value
  const { 
    data: storedValue,
    isLoading: isLoadingValue,
    isError: isErrorReading,
    refetch: refetchStoredValue
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'retrieve',
  });

  // Write a new value
  const { 
    data: hash,
    isPending,
    writeContractAsync,
    error: writeError
  } = useWriteContract();

  // Track transaction status
  const { 
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    status: txStatus
  } = useWaitForTransactionReceipt({ 
    hash,
  });

  // Automatically refresh data when transaction confirms
  useEffect(() => {
    if (isConfirmed && !transactionCompleted) {
      // Set small delay to ensure blockchain has updated
      const timer = setTimeout(() => {
        refetchStoredValue();
        setTransactionCompleted(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    
    // Reset transaction completed flag when hash changes
    if (hash && transactionCompleted) {
      setTransactionCompleted(false);
    }
  }, [isConfirmed, hash, refetchStoredValue, transactionCompleted]);

  // Store a new value
  const storeValue = async (value: number) => {
    try {
      setIsStoring(true);
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'store',
        args: [value],
      });
      return true;
    } catch (error) {
      console.error('Error storing value:', error);
      return false;
    } finally {
      setIsStoring(false);
    }
  };

  // Manual refresh function that can be called from anywhere
  const refreshData = useCallback(async () => {
    await refetchStoredValue();
  }, [refetchStoredValue]);

  return {
    // Read state
    storedValue: storedValue as bigint | undefined,
    isLoadingValue,
    isErrorReading,
    
    // Write state
    storeValue,
    isStoring: isStoring || isPending || isConfirming,
    isConfirmed,
    txStatus,
    writeError,
    
    // Transaction hash
    transactionHash: hash,
    
    // Refresh functionality
    refreshData,
    transactionCompleted
  };
}
