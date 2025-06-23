// Import ABIs
import DensoFiLaunchpadABI from './abis/DensoFiLaunchpad.json';
import DensofiUniV3VaultABI from './abis/DensofiUniV3Vault.json';
import DomainRegistrationABI from './abis/DomainRegistration.json';
import InitialSupplySuperchainERC20ABI from './abis/InitialSupplySuperchainERC20.json';
import NFTMinterABI from './abis/NFTMinter.json';
import TokenMinterABI from './abis/TokenMinter.json';

// Import deployment addresses
import addresses747 from './deployment-addresses/747-addresses.json';
import addresses11155111 from './deployment-addresses/11155111-addresses.json';

// Supported chain IDs
export const SUPPORTED_CHAIN_IDS = [747, 11155111] as const;
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

// Chain configurations
export const CHAIN_CONFIGS = {
  747: addresses747,
  11155111: addresses11155111,
} as const;


// Contract ABIs
export const ABIS = {
  DensoFiLaunchpad: DensoFiLaunchpadABI,
  DensofiUniV3Vault: DensofiUniV3VaultABI,
  DomainRegistration: DomainRegistrationABI,
  InitialSupplySuperchainERC20: InitialSupplySuperchainERC20ABI,
  NFTMinter: NFTMinterABI,
  TokenMinter: TokenMinterABI,
} as const;


// Helper functions to get contract addresses by chain
export function getContractAddresses(chainId: SupportedChainId) {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config.addresses;
}

export function getChainParameters(chainId: SupportedChainId) {
  const config = CHAIN_CONFIGS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config.parameters;
}

export function getContractAddress(chainId: SupportedChainId, contractName: keyof typeof CHAIN_CONFIGS[SupportedChainId]['addresses']) {
  const addresses = getContractAddresses(chainId);
  return addresses[contractName];
}

// Specific contract getters
export function getDomainRegistrationAddress(chainId: SupportedChainId) {
  return getContractAddress(chainId, 'domainRegistration');
}

export function getNFTMinterAddress(chainId: SupportedChainId) {
  return getContractAddress(chainId, 'nftMinter');
}

export function getTokenMinterAddress(chainId: SupportedChainId) {
  return getContractAddress(chainId, 'tokenMinter');
}

export function getLaunchpadAddress(chainId: SupportedChainId) {
  return getContractAddress(chainId, 'launchpad');
}

// Check if chain is supported
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

// Get chain name for display
export function getChainName(chainId: SupportedChainId): string {
  switch (chainId) {
    case 747:
      return 'Flow Mainnet';
    case 11155111:
      return 'Sepolia';
    default:
      return `Chain ${chainId}`;
  }
}