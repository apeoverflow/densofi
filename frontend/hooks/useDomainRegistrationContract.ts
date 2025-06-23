import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { ABIS, getContractAddress, isSupportedChain, getChainName } from '@/constants/contract';
import { useChainId } from 'wagmi';
import { useMemo, useEffect } from 'react';

export function useDomainRegistrationContract() {
  const chainId = useChainId();
  
  const contractConfig = useMemo(() => {
    console.log('useDomainRegistrationContract: Current chain ID:', chainId);
    console.log('useDomainRegistrationContract: Is supported chain:', isSupportedChain(chainId));
    
    if (!isSupportedChain(chainId)) {
      console.warn('useDomainRegistrationContract: Unsupported chain ID:', chainId);
      return null;
    }
    
    try {
      const address = getContractAddress(chainId, 'domainRegistration') as `0x${string}`;
      console.log('useDomainRegistrationContract: Contract address:', address);
      
      return {
        address,
        abi: ABIS.DomainRegistration,
        chainId,
      };
    } catch (error) {
      console.error('useDomainRegistrationContract: Error getting contract address:', error);
      return null;
    }
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
  const { 
    data: registrationFee, 
    error: feeError,
    isLoading: feeLoading 
  } = useReadContract({
    ...contractConfig,
    functionName: 's_registrationFee',
    query: {
      enabled: !!contractConfig,
    },
  });

  // Debug logging for registration fee
  useEffect(() => {
    console.log('useDomainRegistrationContract: Registration fee state:', {
      registrationFee,
      feeError,
      feeLoading,
      contractConfig: !!contractConfig,
      chainId
    });
  }, [registrationFee, feeError, feeLoading, contractConfig, chainId]);

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
    console.log('requestRegistration called with:', {
      domainName,
      contractConfig: !!contractConfig,
      registrationFee,
      chainId,
      chainName: isSupportedChain(chainId) ? getChainName(chainId) : 'Unsupported',
    });

    if (!contractConfig) {
      const errorMsg = !isSupportedChain(chainId) 
        ? `Unsupported chain: ${chainId}. Please connect to chain 747 or 11155111 (Sepolia)`
        : 'Contract configuration not available';
      throw new Error(errorMsg);
    }

    if (!registrationFee) {
      const errorMsg = feeError 
        ? `Failed to load registration fee: ${feeError.message}`
        : feeLoading 
        ? 'Registration fee is still loading. Please wait a moment and try again.'
        : 'Registration fee not available';
      throw new Error(errorMsg);
    }

    try {
      console.log('Executing writeContract with:', {
        address: contractConfig.address,
        functionName: 'requestRegistration',
        args: [domainName],
        value: registrationFee.toString(),
      });

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
    if (!contractConfig) {
      const errorMsg = !isSupportedChain(chainId) 
        ? `Unsupported chain: ${chainId}. Please connect to chain 747 or 11155111 (Sepolia)`
        : 'Contract configuration not available';
      throw new Error(errorMsg);
    }

    if (!ownershipUpdateFee) {
      throw new Error('Ownership update fee not loaded');
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
    chainId,
    isSupported: isSupportedChain(chainId),
    chainName: isSupportedChain(chainId) ? getChainName(chainId) : 'Unsupported',
    
    // Loading states
    feeLoading,
    feeError,
    
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