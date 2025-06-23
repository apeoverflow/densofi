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

// Token Minter Event Types
export interface TokenCreatedEvent {
  nftId: bigint;
  tokenAddress: `0x${string}`;
  tokenName: string;
  receivedDirectly: boolean;
  feeAmount: bigint;
}

export interface NFTReceivedEvent {
  tokenId: bigint;
  from: `0x${string}`;
}

export interface FixedFeeUpdatedEvent {
  newFee: bigint;
}

export interface LaunchpadContractUpdatedEvent {
  newLaunchpad: `0x${string}`;
}

export interface ProceedsWithdrawnEvent {
  to: `0x${string}`;
  amount: bigint;
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

// Union type for all token minter events
export type TokenMinterEvent = 
  | TokenCreatedEvent 
  | NFTReceivedEvent 
  | FixedFeeUpdatedEvent 
  | LaunchpadContractUpdatedEvent 
  | ProceedsWithdrawnEvent;

// Event log with parsed args
export interface DomainRegistrationEventLog extends Log {
  eventName: string;
  args: DomainRegistrationEvent;
}

export interface NFTMinterEventLog extends Log {
  eventName: string;
  args: NFTMinterEvent;
}

export interface TokenMinterEventLog extends Log {
  eventName: string;
  args: TokenMinterEvent;
}

// Event handler function type
export type EventHandler<T = DomainRegistrationEvent | NFTMinterEvent | TokenMinterEvent> = (
  event: T,
  log: Log
) => void | Promise<void>; 