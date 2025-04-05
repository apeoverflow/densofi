import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TOKEN_MINTER_ABI, TOKEN_MINTER_SEPOLIA_ADDRESS } from '@/constants/contract';
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for interacting with the TokenMinter contract
 */
export function useTokenMinterContract() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionCompleted, setTransactionCompleted] = useState(false);
  
  // Read the NFT name
  const getNFTName = (nftId: number) => {
    return useReadContract({
      address: TOKEN_MINTER_SEPOLIA_ADDRESS,
      abi: TOKEN_MINTER_ABI,
      functionName: 'getNFTName',
      args: [nftId],
    });
  };

  // Read token address for NFT
  const getTokenAddress = (nftId: number) => {
    return useReadContract({
      address: TOKEN_MINTER_SEPOLIA_ADDRESS,
      abi: TOKEN_MINTER_ABI,
      functionName: 'getTokenAddress',
      args: [nftId],
    });
  };

  // Check if NFT has been used
  const isNFTUsed = (nftId: number) => {
    return useReadContract({
      address: TOKEN_MINTER_SEPOLIA_ADDRESS,
      abi: TOKEN_MINTER_ABI,
      functionName: 'usedNFTs',
      args: [nftId],
    });
  };

  // Write contract
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

  // Reset transaction completed flag when hash changes
  useEffect(() => {
    if (hash && transactionCompleted) {
      setTransactionCompleted(false);
    }
    
    if (isConfirmed && !transactionCompleted) {
      const timer = setTimeout(() => {
        setTransactionCompleted(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hash, isConfirmed, transactionCompleted]);

  // Create token from NFT
  const createTokenFromNFT = async (nftId: number) => {
    try {
      setIsProcessing(true);
      await writeContractAsync({
        address: TOKEN_MINTER_SEPOLIA_ADDRESS,
        abi: TOKEN_MINTER_ABI,
        functionName: 'createTokenFromNFT',
        args: [nftId],
      });
      return true;
    } catch (error) {
      console.error('Error creating token from NFT:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    // Read functions
    getNFTName,
    getTokenAddress,
    isNFTUsed,
    
    // Write functions
    createTokenFromNFT,
    
    // State
    isProcessing: isProcessing || isPending || isConfirming,
    isConfirmed,
    txStatus,
    writeError,
    
    // Transaction hash
    transactionHash: hash,
    transactionCompleted
  };
}