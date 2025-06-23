import { useEffect, useState, useCallback } from 'react';
import { useWatchContractEvent, usePublicClient, useAccount, useReadContract } from 'wagmi';
import { parseAbiItem } from 'viem';
import { ABIS, getContractAddress, isSupportedChain } from '@/constants/contract';
import { useChainId } from 'wagmi';

// Event types
interface RegistrationRequestedEvent {
  domainName: string;
  requester: string;
  fee: bigint;
}

interface NFTMintedEvent {
  tokenId: bigint;
  to: string;
  domainNameHash: string;
  domainName: string;
}

interface DomainOwnerSetEvent {
  domainNameHash: string;
  owner: string;
  domainName: string;
}

interface DomainMintableStatusSetEvent {
  domainNameHash: string;
  isMintable: boolean;
  domainName: string;
}

// Hook for listening to domain registration events
export function useDomainRegistrationEvents(targetDomain?: string) {
  const [registrationEvents, setRegistrationEvents] = useState<RegistrationRequestedEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<RegistrationRequestedEvent | null>(null);
  const { address } = useAccount();
  const chainId = useChainId();
  
  const contractAddress = isSupportedChain(chainId) 
    ? getContractAddress(chainId, 'domainRegistration') as `0x${string}`
    : undefined;

  // Watch for RegistrationRequested events
  useWatchContractEvent({
    address: contractAddress,
    abi: ABIS.DomainRegistration,
    eventName: 'RegistrationRequested',
    onLogs: (logs) => {
      logs.forEach((log: any) => {
        const args = log.args;
        if (!args) return;
        
        const event = {
          domainName: args.domainName as string,
          requester: args.requester as string,
          fee: args.fee as bigint,
        };

        console.log('🎯 Domain Registration Event Received:', event);

        // If we're filtering for a specific domain and requester
        const isTargetDomain = !targetDomain || event.domainName.toLowerCase() === targetDomain.toLowerCase();
        const isCurrentUser = !address || event.requester.toLowerCase() === address.toLowerCase();

        if (isTargetDomain && isCurrentUser) {
          setLatestEvent(event);
          setRegistrationEvents(prev => [...prev, event]);
        }
      });
    },
    enabled: !!contractAddress,
  });

  const clearEvents = useCallback(() => {
    setRegistrationEvents([]);
    setLatestEvent(null);
  }, []);

  return {
    registrationEvents,
    latestEvent,
    clearEvents,
    isListening: !!contractAddress,
  };
}

// Hook for listening to NFT minting events
export function useNFTMintingEvents(targetDomain?: string) {
  const [mintingEvents, setMintingEvents] = useState<NFTMintedEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<NFTMintedEvent | null>(null);
  const { address } = useAccount();
  const chainId = useChainId();
  
  const contractAddress = isSupportedChain(chainId) 
    ? getContractAddress(chainId, 'nftMinter') as `0x${string}`
    : undefined;

  // Watch for NFTMinted events
  useWatchContractEvent({
    address: contractAddress,
    abi: ABIS.NFTMinter,
    eventName: 'NFTMinted',
    onLogs: (logs) => {
      logs.forEach((log: any) => {
        const args = log.args;
        if (!args) return;
        
        const event = {
          tokenId: args.tokenId as bigint,
          to: args.to as string,
          domainNameHash: args.domainNameHash as string,
          domainName: args.domainName as string,
        };

        console.log('🎯 NFT Minting Event Received:', event);

        // If we're filtering for a specific domain and recipient
        const isTargetDomain = !targetDomain || event.domainName.toLowerCase() === targetDomain.toLowerCase();
        const isCurrentUser = !address || event.to.toLowerCase() === address.toLowerCase();

        if (isTargetDomain && isCurrentUser) {
          setLatestEvent(event);
          setMintingEvents(prev => [...prev, event]);
        }
      });
    },
    enabled: !!contractAddress,
  });

  const clearEvents = useCallback(() => {
    setMintingEvents([]);
    setLatestEvent(null);
  }, []);

  return {
    mintingEvents,
    latestEvent,
    clearEvents,
    isListening: !!contractAddress,
  };
}

// Hook for listening to domain owner set events
export function useDomainOwnerEvents(targetDomain?: string) {
  const [ownerEvents, setOwnerEvents] = useState<DomainOwnerSetEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<DomainOwnerSetEvent | null>(null);
  const { address } = useAccount();
  const chainId = useChainId();
  
  const contractAddress = isSupportedChain(chainId) 
    ? getContractAddress(chainId, 'nftMinter') as `0x${string}`
    : undefined;

  // Watch for DomainOwnerSet events
  useWatchContractEvent({
    address: contractAddress,
    abi: ABIS.NFTMinter,
    eventName: 'DomainOwnerSet',
    onLogs: (logs) => {
      logs.forEach((log: any) => {
        const args = log.args;
        if (!args) return;
        
        const event = {
          domainNameHash: args.domainNameHash as string,
          owner: args.owner as string,
          domainName: args.domainName as string,
        };

        console.log('🎯 Domain Owner Set Event Received:', event);

        // If we're filtering for a specific domain and owner
        const isTargetDomain = !targetDomain || event.domainName.toLowerCase() === targetDomain.toLowerCase();
        const isCurrentUser = !address || event.owner.toLowerCase() === address.toLowerCase();

        if (isTargetDomain && isCurrentUser) {
          setLatestEvent(event);
          setOwnerEvents(prev => [...prev, event]);
        }
      });
    },
    enabled: !!contractAddress,
  });

  const clearEvents = useCallback(() => {
    setOwnerEvents([]);
    setLatestEvent(null);
  }, []);

  return {
    ownerEvents,
    latestEvent,
    clearEvents,
    isListening: !!contractAddress,
  };
}

// Hook for listening to domain mintable status events and polling mintable status
export function useDomainMintableStatus(targetDomain?: string) {
  const [mintableEvents, setMintableEvents] = useState<DomainMintableStatusSetEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<DomainMintableStatusSetEvent | null>(null);
  const [isReadyForMinting, setIsReadyForMinting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const { address } = useAccount();
  const chainId = useChainId();
  
  const contractAddress = isSupportedChain(chainId) 
    ? getContractAddress(chainId, 'nftMinter') as `0x${string}`
    : undefined;

  // Watch for DomainMintableStatusSet events
  useWatchContractEvent({
    address: contractAddress,
    abi: ABIS.NFTMinter,
    eventName: 'DomainMintableStatusSet',
    onLogs: (logs) => {
      logs.forEach((log: any) => {
        const args = log.args;
        if (!args) return;
        
        const event = {
          domainNameHash: args.domainNameHash as string,
          isMintable: args.isMintable as boolean,
          domainName: args.domainName as string,
        };

        console.log('🎯 Domain Mintable Status Event Received:', event);

        // If we're filtering for a specific domain
        const isTargetDomain = !targetDomain || event.domainName.toLowerCase() === targetDomain.toLowerCase();

        if (isTargetDomain) {
          setLatestEvent(event);
          setMintableEvents(prev => [...prev, event]);
        }
      });
    },
    enabled: !!contractAddress && !!targetDomain,
  });

  // Read domain mintable status from contract
  const { data: isDomainMintable, refetch: refetchMintable } = useReadContract({
    address: contractAddress,
    abi: ABIS.NFTMinter,
    functionName: 'isDomainMintable',
    args: targetDomain ? [targetDomain] : undefined,
    query: {
      enabled: !!contractAddress && !!targetDomain,
    },
  });

  // Read domain owner from contract
  const { data: domainOwner, refetch: refetchOwner } = useReadContract({
    address: contractAddress,
    abi: ABIS.NFTMinter,
    functionName: 'getDomainOwner',
    args: targetDomain ? [targetDomain] : undefined,
    query: {
      enabled: !!contractAddress && !!targetDomain,
    },
  });

  // Check if domain already has an NFT minted
  const { data: existingTokenId } = useReadContract({
    address: contractAddress,
    abi: ABIS.NFTMinter,
    functionName: 'getTokenIdForDomain',
    args: targetDomain ? [targetDomain] : undefined,
    query: {
      enabled: !!contractAddress && !!targetDomain,
    },
  });

  // Poll contract state when events are received or polling is requested
  const pollContractState = useCallback(async () => {
    if (!targetDomain || !contractAddress) return;

    try {
      console.log('🔄 Polling domain mintable status for:', targetDomain);
      const [mintableResult, ownerResult] = await Promise.all([
        refetchMintable(),
        refetchOwner(),
      ]);

      console.log('📊 Poll results:', {
        domain: targetDomain,
        isMintable: mintableResult.data,
        owner: ownerResult.data,
        currentUser: address,
        existingTokenId: existingTokenId ? Number(existingTokenId) : 0,
      });
    } catch (error) {
      console.error('❌ Error polling contract state:', error);
    }
  }, [targetDomain, contractAddress, refetchMintable, refetchOwner, address, existingTokenId]);

  // Effect to check if domain is ready for minting
  useEffect(() => {
    if (!targetDomain || !address || !domainOwner || isDomainMintable === undefined) {
      setIsReadyForMinting(false);
      return;
    }

    const isOwner = domainOwner && address && (domainOwner as string).toLowerCase() === address.toLowerCase();
    const isMintable = Boolean(isDomainMintable);
    const hasNoNFT = !existingTokenId || Number(existingTokenId) === 0;

    const readyForMinting = isOwner && isMintable && hasNoNFT;

    console.log('🔍 Checking minting readiness:', {
      domain: targetDomain,
      isOwner,
      isMintable,
      hasNoNFT,
      readyForMinting,
      domainOwner,
      currentUser: address,
      existingTokenId: existingTokenId ? Number(existingTokenId) : 0,
    });

    setIsReadyForMinting(readyForMinting);
  }, [targetDomain, address, domainOwner, isDomainMintable, existingTokenId]);

  // Auto-poll when events are received
  useEffect(() => {
    if (latestEvent) {
      pollContractState();
    }
  }, [latestEvent, pollContractState]);

  const startPolling = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);
    const interval = setInterval(() => {
      pollContractState();
    }, 5000); // Poll every 5 seconds

    // Auto-stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
      setIsPolling(false);
    }, 120000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [isPolling, pollContractState]);

  const clearEvents = useCallback(() => {
    setMintableEvents([]);
    setLatestEvent(null);
    setIsReadyForMinting(false);
  }, []);

  return {
    mintableEvents,
    latestEvent,
    isReadyForMinting,
    isDomainMintable: Boolean(isDomainMintable),
    domainOwner: domainOwner as string,
    existingTokenId: existingTokenId ? Number(existingTokenId) : 0,
    isPolling,
    startPolling,
    pollContractState,
    clearEvents,
    isListening: !!contractAddress,
  };
} 