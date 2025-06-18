import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ABIS, getContractAddress, getTokenMinterAddress, isSupportedChain } from '@/constants/contract';
import { useChainId } from 'wagmi';
import { useState, useEffect, useMemo } from 'react';

/**
 * Custom hook for interacting with the NFTMinter contract
 */
export function useNFTMinterContract() {
  const chainId = useChainId();
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionCompleted, setTransactionCompleted] = useState(false);
  
  const contractConfig = useMemo(() => {
    if (!isSupportedChain(chainId)) {
      return null;
    }
    
    return {
      address: getContractAddress(chainId, 'nftMinter') as `0x${string}`,
      abi: ABIS.NFTMinter,
      chainId,
    };
  }, [chainId]);

  const tokenMinterAddress = useMemo(() => {
    if (!isSupportedChain(chainId)) {
      return null;
    }
    return getTokenMinterAddress(chainId);
  }, [chainId]);
  
  // Read the token name from ID
  const readTokenName = (tokenId: number) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getTokenNameFromId',
      args: [tokenId],
      query: {
        enabled: !!contractConfig,
      },
    });
  };

  // Check if token minter is approved to transfer NFTs
  const isApprovedForAll = (owner: string, operator?: string) => {
    const operatorAddress = operator || tokenMinterAddress;
    return useReadContract({
      ...contractConfig,
      functionName: 'isApprovedForAll',
      args: [owner as `0x${string}`, operatorAddress as `0x${string}`],
      query: {
        enabled: !!contractConfig && !!owner && !!operatorAddress,
      },
    });
  };

  // Get domain owner
  const getDomainOwner = (domainName: string) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getDomainOwner',
      args: [domainName],
      query: {
        enabled: !!contractConfig && !!domainName,
      },
    });
  };

  // Check if domain is mintable
  const isDomainMintable = (domainName: string) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'isDomainMintable',
      args: [domainName],
      query: {
        enabled: !!contractConfig && !!domainName,
      },
    });
  };

  // Get token ID for domain
  const getTokenIdForDomain = (domainName: string) => {
    return useReadContract({
      ...contractConfig,
      functionName: 'getTokenIdForDomain',
      args: [domainName],
      query: {
        enabled: !!contractConfig && !!domainName,
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

  // Mint a new domain NFT
  const mintNFT = async (domainName: string) => {
    if (!contractConfig) {
      throw new Error('Contract not available');
    }

    try {
      setIsProcessing(true);
      await writeContractAsync({
        ...contractConfig,
        functionName: 'mintDomainNFT',
        args: [domainName],
      });
      return true;
    } catch (error) {
      console.error('Error minting NFT:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Mint NFT via resolver (legacy function - keeping for compatibility)
  const mintNFTViaResolver = async (domainName: string) => {
    return mintNFT(domainName);
  };

  // Set approval for token minter contract to transfer NFTs
  const setApprovalForAll = async (operator?: string, approved: boolean = true) => {
    if (!contractConfig) {
      throw new Error('Contract not available');
    }

    const operatorAddress = operator || tokenMinterAddress;
    if (!operatorAddress) {
      throw new Error('Token minter address not available');
    }

    try {
      setIsProcessing(true);
      await writeContractAsync({
        ...contractConfig,
        functionName: 'setApprovalForAll',
        args: [operatorAddress as `0x${string}`, approved],
      });
      return true;
    } catch (error) {
      console.error('Error setting approval for all:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    // Contract info
    contractAddress: contractConfig?.address,
    tokenMinterAddress,
    
    // Read functions
    readTokenName,
    isApprovedForAll,
    getDomainOwner,
    isDomainMintable,
    getTokenIdForDomain,
    
    // Write functions
    mintNFT,
    mintNFTViaResolver,
    setApprovalForAll,
    
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