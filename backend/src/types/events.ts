import type { Log } from 'viem';

// Domain Registration Event Types
export interface RegistrationRequestedEvent {
  domainName: string;
  requester: `0x${string}`;
  fee: bigint;
}

export interface OwnershipUpdateRequestedEvent {
  domainName: string;
  requester: `0x${string}`;
  fee: bigint;
}

export interface RegistrationFeeUpdatedEvent {
  newFee: bigint;
}

export interface OwnershipUpdateFeeUpdatedEvent {
  newFee: bigint;
}

// NFT Minter Event Types
export interface NFTMintedEvent {
  tokenId: bigint;
  to: `0x${string}`;
  domainNameHash: `0x${string}`;
  domainName: string;
}

export interface DomainOwnerSetEvent {
  domainNameHash: `0x${string}`;
  owner: `0x${string}`;
  domainName: string;
}

export interface DomainMintableStatusSetEvent {
  domainNameHash: `0x${string}`;
  isMintable: boolean;
  domainName: string;
}

export interface DomainNFTMintedStatusSetEvent {
  domainNameHash: `0x${string}`;
  isMinted: boolean;
  domainName: string;
}

// Union type for all domain registration events
export type DomainRegistrationEvent = 
  | RegistrationRequestedEvent 
  | OwnershipUpdateRequestedEvent 
  | RegistrationFeeUpdatedEvent 
  | OwnershipUpdateFeeUpdatedEvent;

// Union type for all NFT minter events
export type NFTMinterEvent = 
  | NFTMintedEvent 
  | DomainOwnerSetEvent 
  | DomainMintableStatusSetEvent 
  | DomainNFTMintedStatusSetEvent;

// Event log with parsed args
export interface DomainRegistrationEventLog extends Log {
  eventName: string;
  args: DomainRegistrationEvent;
}

export interface NFTMinterEventLog extends Log {
  eventName: string;
  args: NFTMinterEvent;
}

// Event handler function type
export type EventHandler<T = DomainRegistrationEvent | NFTMinterEvent> = (
  event: T,
  log: Log
) => void | Promise<void>; 