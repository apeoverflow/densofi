import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { ABIS, getContractAddress, isSupportedChain } from '@/constants/contract';
import { useChainId } from 'wagmi';
import { useMemo } from 'react';

export function useDomainRegistrationContract() {
  const chainId = useChainId();
  
  const contractConfig = useMemo(() => {
    if (!isSupportedChain(chainId)) {
      return null;
    }
    
    return {
      address: getContractAddress(chainId, 'domainRegistration') as `0x${string}`,
      abi: ABIS.DomainRegistration,
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

  // Read registration fee
  const { data: registrationFee } = useReadContract({
    ...contractConfig,
    functionName: 's_registrationFee',
    query: {
      enabled: !!contractConfig,
    },
  });

  // Read ownership update fee
  const { data: ownershipUpdateFee } = useReadContract({
    ...contractConfig,
    functionName: 's_ownershipUpdateFee',
    query: {
      enabled: !!contractConfig,
    },
  });

  // Request domain registration
  const requestRegistration = async (domainName: string) => {
    if (!contractConfig || !registrationFee) {
      throw new Error('Contract not available or fee not loaded');
    }

    try {
      writeContract({
        ...contractConfig,
        functionName: 'requestRegistration',
        args: [domainName],
        value: registrationFee as bigint,
      });
      return true;
    } catch (error) {
      console.error('Error requesting domain registration:', error);
      throw error;
    }
  };

  // Request domain ownership update
  const requestOwnershipUpdate = async (domainName: string) => {
    if (!contractConfig || !ownershipUpdateFee) {
      throw new Error('Contract not available or fee not loaded');
    }

    try {
      writeContract({
        ...contractConfig,
        functionName: 'requestDomainOwnershipUpdate',
        args: [domainName],
        value: ownershipUpdateFee as bigint,
      });
      return true;
    } catch (error) {
      console.error('Error requesting domain ownership update:', error);
      throw error;
    }
  };

  return {
    // Contract info
    contractAddress: contractConfig?.address,
    registrationFee,
    ownershipUpdateFee,
    
    // Transaction state
    isProcessing,
    isConfirming,
    isConfirmed,
    transactionHash: hash,
    writeError,
    
    // Functions
    requestRegistration,
    requestOwnershipUpdate,
  };
} 