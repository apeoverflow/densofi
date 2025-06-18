import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ABIS, getContractAddress, isSupportedChain } from '@/constants/contract';
import { useChainId } from 'wagmi';
import { useMemo } from 'react';

export function useLaunchpadContract() {
  const chainId = useChainId();
  
  const contractConfig = useMemo(() => {
    if (!isSupportedChain(chainId)) {
      return null;
    }
    
    return {
      address: getContractAddress(chainId, 'launchpad') as `0x${string}`,
      abi: ABIS.DensoFiLaunchpad,
      chainId,
    };
  }, [chainId]);

  // Write contract hook
  const { 
    writeContract, 
    data: hash, 
    isPending: isProcessing, 
    error: writeError 
  } = useWriteContract();

  // Wait for transaction receipt
  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Read creation price
  const { data: creationPrice } = useReadContract({
    ...contractConfig,
    functionName: 's_creationPrice',
    query: {
      enabled: !!contractConfig,
    },
  });

  // Read transaction fee
  const { data: txFee } = useReadContract({
    ...contractConfig,
    functionName: 's_txFee',
    query: {
      enabled: !!contractConfig,
    },
  });

  // Get pool info for a token
  const getPoolInfo = (tokenAddress: string) => useReadContract({
    ...contractConfig,
    functionName: 'getPoolInfo',
    args: [tokenAddress as `0x${string}`],
    query: {
      enabled: !!contractConfig && !!tokenAddress,
    },
  });

  // Calculate market cap for a token
  const calculateMarketCap = (tokenAddress: string) => useReadContract({
    ...contractConfig,
    functionName: 'calculateMarketCap',
    args: [tokenAddress as `0x${string}`],
    query: {
      enabled: !!contractConfig && !!tokenAddress,
    },
  });

  // Quote tokens for buying/selling
  const quoteTokens = (tokenAddress: string, amount: bigint, buyOrder: boolean) => useReadContract({
    ...contractConfig,
    functionName: 'quoteTokens',
    args: [tokenAddress as `0x${string}`, amount, buyOrder],
    query: {
      enabled: !!contractConfig && !!tokenAddress && !!amount,
    },
  });

  // Create token
  const createToken = async (
    name: string,
    symbol: string,
    imageCid: string,
    description: string,
    sellPenalty: number,
    initialBuy: bigint,
    totalValue: bigint
  ) => {
    if (!contractConfig) {
      throw new Error('Contract not available');
    }

    try {
      writeContract({
        ...contractConfig,
        functionName: 'createToken',
        args: [name, symbol, imageCid, description, sellPenalty, initialBuy],
        value: totalValue,
      });
      return true;
    } catch (error) {
      console.error('Error creating token:', error);
      throw error;
    }
  };

  // Buy tokens
  const buyTokens = async (tokenAddress: string, minTokensOut: bigint, ethAmount: bigint) => {
    if (!contractConfig) {
      throw new Error('Contract not available');
    }

    try {
      writeContract({
        ...contractConfig,
        functionName: 'buyTokens',
        args: [tokenAddress as `0x${string}`, minTokensOut],
        value: ethAmount,
      });
      return true;
    } catch (error) {
      console.error('Error buying tokens:', error);
      throw error;
    }
  };

  // Sell tokens
  const sellTokens = async (tokenAddress: string, tokenAmount: bigint, minEthOut: bigint) => {
    if (!contractConfig) {
      throw new Error('Contract not available');
    }

    try {
      writeContract({
        ...contractConfig,
        functionName: 'sellTokens',
        args: [tokenAddress as `0x${string}`, tokenAmount, minEthOut],
      });
      return true;
    } catch (error) {
      console.error('Error selling tokens:', error);
      throw error;
    }
  };

  // Launch token to Uniswap (owner only)
  const launchToken = async (tokenAddress: string, additionalEth: bigint = BigInt(0)) => {
    if (!contractConfig) {
      throw new Error('Contract not available');
    }

    try {
      writeContract({
        ...contractConfig,
        functionName: 'launchToken',
        args: [tokenAddress as `0x${string}`],
        value: additionalEth,
      });
      return true;
    } catch (error) {
      console.error('Error launching token:', error);
      throw error;
    }
  };

  // Get oracle price
  const getOraclePrice = () => useReadContract({
    ...contractConfig,
    functionName: 'getOraclePrice',
    query: {
      enabled: !!contractConfig,
    },
  });

  // Update domain ownership (owner only)
  const updateDomainOwnership = async (domainName: string, newOwner: string) => {
    if (!contractConfig) {
      throw new Error('Contract not available');
    }

    try {
      writeContract({
        ...contractConfig,
        functionName: 'updateDomainOwnership',
        args: [domainName, newOwner as `0x${string}`],
      });
      return true;
    } catch (error) {
      console.error('Error updating domain ownership:', error);
      throw error;
    }
  };

  return {
    // Contract info
    contractAddress: contractConfig?.address,
    creationPrice,
    txFee,
    
    // Transaction state
    isProcessing,
    isConfirming,
    isConfirmed,
    transactionHash: hash,
    writeError,
    
    // Read functions
    getPoolInfo,
    calculateMarketCap,
    quoteTokens,
    getOraclePrice,
    
    // Write functions
    createToken,
    buyTokens,
    sellTokens,
    launchToken,
    updateDomainOwnership,
  };
} 