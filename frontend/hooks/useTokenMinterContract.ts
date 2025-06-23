import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ABIS, getContractAddress, isSupportedChain } from '@/constants/contract';
import { useChainId } from 'wagmi';
import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for interacting with the TokenMinter contract
 */
export function useTokenMinterContract() {
  const chainId = useChainId();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionCompleted, setTransactionCompleted] = useState(false);

  const contractConfig = useMemo(() => {
    if (!isSupportedChain(chainId)) {
      return null;
    }
    
    return {
      address: getContractAddress(chainId, 'tokenMinter') as `0x${string}`,
      abi: ABIS.TokenMinter,
      chainId,
    };
  }, [chainId]);

  // Read fixed fee for direct receipt
  const { data: fixedFee } = useReadContract({
    ...contractConfig,
    functionName: 'fixedFee',
    query: {
      enabled: !!contractConfig,
    },
  });

  // Read launchpad contract address
  const { data: launchpadContract } = useReadContract({
    ...contractConfig,
    functionName: 'launchpadContract',
    query: {
      enabled: !!contractConfig,
    },
  });

  // Get token address for an NFT ID
  const getTokenAddress = (nftId: number) => {

    return useReadContract({
      ...contractConfig,
      functionName: 'getTokenAddress',
      args: [nftId],
      query: {
        enabled: !!contractConfig && nftId !== undefined,
      },
    });
  };

  // Get NFT name
  const getNFTName = (nftId: number) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getNFTName',
      args: [nftId],
      query: {
        enabled: !!contractConfig && nftId !== undefined,
      },
    });
  };

  // Get token creation details
  const getTokenCreationDetails = (nftId: number) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getTokenCreationDetails',
      args: [nftId],
      query: {
        enabled: !!contractConfig && nftId !== undefined,
      },
    });
  };

  // Check if NFT has been used to create a token
  const isNFTUsed = (nftId: number) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'usedNFTs',
      args: [nftId],
      query: {
        enabled: !!contractConfig && nftId !== undefined,
      },
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
  const createTokenFromNFT = async (nftId: number, receiveTokensDirectly: boolean = false) => {
    if (!contractConfig) {
      throw new Error('Contract not available');
    }

    try {
      setIsProcessing(true);
      
      const value = receiveTokensDirectly && fixedFee ? fixedFee : BigInt(0);
      
      await writeContractAsync({
        ...contractConfig,
        functionName: 'createTokenFromNFT',
        args: [nftId, receiveTokensDirectly],
        value: value as bigint,
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
    // Contract info
    contractAddress: contractConfig?.address,
    fixedFee,
    launchpadContract,
    
    // Read functions
    getTokenAddress,
    getNFTName,
    getTokenCreationDetails,
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