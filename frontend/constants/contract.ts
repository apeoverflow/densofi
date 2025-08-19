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
export const SUPPORTED_CHAIN_IDS = [747] as const; // 11155111] as const;
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

// Chain configurations
export const CHAIN_CONFIGS = {
  747: addresses747,
  // 11155111: addresses11155111,
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
    // case 11155111:
    //   return 'Sepolia';
    default:
      return `Chain ${chainId}`;
  }
}

// Contract address getters that work with any supported chain
export const CONTRACT_ADDRESSES = {
  getDomainRegistration: (chainId: SupportedChainId) => getContractAddress(chainId, 'domainRegistration'),
  getNFTMinter: (chainId: SupportedChainId) => getContractAddress(chainId, 'nftMinter'),
  getTokenMinter: (chainId: SupportedChainId) => getContractAddress(chainId, 'tokenMinter'),
  getLaunchpad: (chainId: SupportedChainId) => getContractAddress(chainId, 'launchpad'),
} as const;

// Convenience function to get all contract addresses for a specific chain
export function getAllContractAddresses(chainId: SupportedChainId) {
  return {
    domainRegistration: CONTRACT_ADDRESSES.getDomainRegistration(chainId),
    nftMinter: CONTRACT_ADDRESSES.getNFTMinter(chainId),
    tokenMinter: CONTRACT_ADDRESSES.getTokenMinter(chainId),
    launchpad: CONTRACT_ADDRESSES.getLaunchpad(chainId),
  };
}

// Legacy exports for backward compatibility (these will work with the connected network)
// Note: These are now functions that require chainId parameter
export const DOMAIN_REGISTRATION_ADDRESS = (chainId: SupportedChainId) => getContractAddress(chainId, 'domainRegistration');
export const NFT_MINTER_ADDRESS = (chainId: SupportedChainId) => getContractAddress(chainId, 'nftMinter');
export const TOKEN_MINTER_ADDRESS = (chainId: SupportedChainId) => getContractAddress(chainId, 'tokenMinter');
export const LAUNCHPAD_ADDRESS = (chainId: SupportedChainId) => getContractAddress(chainId, 'launchpad');

// If you need static addresses for specific networks (for backward compatibility)
export const STATIC_ADDRESSES = {
  // sepolia: {
  //   domainRegistration: getContractAddress(11155111, 'domainRegistration'),
  //   nftMinter: getContractAddress(11155111, 'nftMinter'),
  //   tokenMinter: getContractAddress(11155111, 'tokenMinter'),
  //   launchpad: getContractAddress(11155111, 'launchpad'),
  // },
  flow: {
    domainRegistration: getContractAddress(747, 'domainRegistration'),
    nftMinter: getContractAddress(747, 'nftMinter'),
    tokenMinter: getContractAddress(747, 'tokenMinter'),
    launchpad: getContractAddress(747, 'launchpad'),
  },
} as const;

// For immediate backward compatibility with existing code
// export const NFT_MINTER_SEPOLIA_ADDRESS = STATIC_ADDRESSES.sepolia.nftMinter;