import { useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ABIS, getContractAddress, isSupportedChain } from '@/constants/contract';
import { useChainId } from 'wagmi';

export function useNFTMinting() {
  const chainId = useChainId();
  
  const { 
    writeContract, 
    data: hash, 
    isPending: isProcessing, 
    error: writeError 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed 
  } = useWaitForTransactionReceipt({
    hash,
  });

  const mintNFT = useCallback((domainName: string) => {
    if (!isSupportedChain(chainId)) {
      throw new Error('Unsupported chain');
    }

    const contractAddress = getContractAddress(chainId, 'nftMinter');
    if (!contractAddress) {
      throw new Error('Contract not deployed on this chain');
    }

    console.log('🎨 Minting NFT for domain:', domainName);

    writeContract({
      address: contractAddress as `0x${string}`,
      abi: ABIS.NFTMinter,
      functionName: 'mintDomainNFT',
      args: [domainName],
    });

    console.log('✅ NFT minting transaction sent');
  }, [chainId, writeContract]);

  return {
    mintNFT,
    isLoading: isProcessing,
    isConfirming,
    isConfirmed,
    error: writeError,
    txHash: hash,
    success: isConfirmed,
  };
} 