import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { NFT_MINTER_ABI, NFT_MINTER_SEPOLIA_ADDRESS } from '@/constants/contract';
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for interacting with the NFTMinter contract
 */
export function useNFTMinterContract() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionCompleted, setTransactionCompleted] = useState(false);
  
  // Read the token name
  const readTokenName = (tokenId: number) => {
    return useReadContract({
      address: NFT_MINTER_SEPOLIA_ADDRESS,
      abi: NFT_MINTER_ABI,
      functionName: 'tokenName',
      args: [tokenId],
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

  // Mint a new NFT
  const mintNFT = async (name: string) => {
    try {
      setIsProcessing(true);
      await writeContractAsync({
        address: NFT_MINTER_SEPOLIA_ADDRESS,
        abi: NFT_MINTER_ABI,
        functionName: 'mint',
        args: [name],
      });
      return true;
    } catch (error) {
      console.error('Error minting NFT:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Mint NFT via resolver (requires domain ownership)
  const mintNFTViaResolver = async (name: string) => {
    try {
      setIsProcessing(true);
      await writeContractAsync({
        address: NFT_MINTER_SEPOLIA_ADDRESS,
        abi: NFT_MINTER_ABI,
        functionName: 'mintViaResolver',
        args: [name],
      });
      return true;
    } catch (error) {
      console.error('Error minting NFT via resolver:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    // Read functions
    readTokenName,
    
    // Write functions
    mintNFT,
    mintNFTViaResolver,
    
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