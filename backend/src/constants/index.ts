// Import ABIs
import { DOMAIN_REGISTRATION_ABI, NFT_MINTER_ABI } from './abis/index.js';

// Deployment addresses - manually defined to avoid JSON import issues
const addresses747 = {
  "chainId": 747,
  "deployer": "0x9b8A91c271B230e8647F01cA9d31e28b79f6d6AA",
  "addresses": {
    "domainRegistration": "0xf5418837202c5970eefcf7415Dd0ae17c64F8C01",
    "nftMinter": "0xC179eD1e83872ea68Dd7308E96C052f8d4088972",
    "tokenMinter": "0x2af0a540846e0E427C3eeBF035Bf02C37bf8a6ab",
    "launchpad": "0x8a6c3E1aF65E2831B37923b0e9B878d229B1B1B5"
  },
  "parameters": {
    "domainRegistrationFee": "100000000000000",
    "uniV3Router": "0x48Ae9ED61c6ECe580Af86F140AcEC3DDB4A7367E",
    "uniV3Factory": "0xf331959366032a634c7cAcF5852fE01ffdB84Af0",
    "nonfungiblePositionManager": "0xDfA7829Eb75B66790b6E9758DF48E518c69ee34a",
    "weth": "0xd3bF53DAC106A0290B0483EcBC89d40FcC961f3e",
    "pythOracle": "0x2880aB155794e7179c9eE2e38200202908C17B43",
    "ethUsdPriceId": "0x2fb245b9a84554a0f15aa123cbb5f64cd263b59e9a87d80148cbffab50c69f30",
    "tokenMinterFixedFee": "100000000000000"
  }
} as const;

const addresses11155111 = {
  "chainId": 11155111,
  "deployer": "0x9b8A91c271B230e8647F01cA9d31e28b79f6d6AA",
  "addresses": {
    "domainRegistration": "0xA6f09EB11F5eDEE3ed04cA213a33e5b362fC8c5B",
    "nftMinter": "0xB41920fD5d6AFDcFBf648F8E2A1CB6376EF0EFA0",
    "tokenMinter": "0xF2029e8B4d5EA818789D2Ab13bfaF0CD48a9D160",
    "launchpad": "0x9AFDC6EcC6DB0176102f9E7EAA104E899b2Dc833"
  },
  "parameters": {
    "domainRegistrationFee": "1000000000000000",
    "uniV3Router": "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
    "uniV3Factory": "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
    "nonfungiblePositionManager": "0x1238536071E1c677A632429e3655c799b22cDA52",
    "weth": "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    "pythOracle": "0xDd24F84d36BF92C65F92307595335bdFab5Bbd21",
    "ethUsdPriceId": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "tokenMinterFixedFee": "100000000000000"
  }
} as const;

const addressesSepolia = {
  "DomainRegistration": "0x2544b5d7aAe9A75D37D94aB015998de847386C10",
  "NFTMinter": "0x53b02Ee79D1B7a69D25C0DAdC59CBaF5241D2Dd0",
  "TokenMinter": "0x2a3D9095ffFCaF9DfA57D1b17D69aEFb449eEd0c"
} as const;

// Supported chain IDs for backend operations
export const SUPPORTED_CHAIN_IDS = [747, 11155111] as const;
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number];

// Chain configurations mapping
export const CHAIN_CONFIGS = {
  747: addresses747,
  11155111: addresses11155111,
} as const;

// Legacy Sepolia addresses (for backward compatibility during migration)
export const LEGACY_SEPOLIA_ADDRESSES = addressesSepolia;

// Export ABIs
export { DOMAIN_REGISTRATION_ABI, NFT_MINTER_ABI };

// Type definitions for chain configuration
export interface ChainConfig {
  chainId: number;
  deployer: string;
  addresses: {
    domainRegistration: string;
    nftMinter: string;
    tokenMinter: string;
    launchpad: string;
  };
  parameters: {
    domainRegistrationFee: string;
    uniV3Router: string;
    uniV3Factory: string;
    nonfungiblePositionManager: string;
    weth: string;
    pythOracle: string;
    ethUsdPriceId: string;
    tokenMinterFixedFee: string;
  };
}

/**
 * Get contract addresses for a specific chain
 */
export function getContractAddresses(chainId: number) {
  if (!isSupportedChain(chainId)) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${SUPPORTED_CHAIN_IDS.join(', ')}`);
  }
  return CHAIN_CONFIGS[chainId].addresses;
}

/**
 * Get chain parameters for a specific chain
 */
export function getChainParameters(chainId: number) {
  if (!isSupportedChain(chainId)) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${SUPPORTED_CHAIN_IDS.join(', ')}`);
  }
  return CHAIN_CONFIGS[chainId].parameters;
}

/**
 * Get a specific contract address for a chain
 */
export function getContractAddress(chainId: number, contractName: keyof ChainConfig['addresses']): string {
  const addresses = getContractAddresses(chainId);
  const address = addresses[contractName];
  if (!address) {
    throw new Error(`Contract ${contractName} not found for chain ${chainId}`);
  }
  return address;
}

/**
 * Specific contract address getters
 */
export function getDomainRegistrationAddress(chainId: number): string {
  return getContractAddress(chainId, 'domainRegistration');
}

export function getNFTMinterAddress(chainId: number): string {
  return getContractAddress(chainId, 'nftMinter');
}

export function getTokenMinterAddress(chainId: number): string {
  return getContractAddress(chainId, 'tokenMinter');
}

export function getLaunchpadAddress(chainId: number): string {
  return getContractAddress(chainId, 'launchpad');
}

/**
 * Check if a chain ID is supported
 */
export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

/**
 * Get chain name for display/logging purposes
 */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case 747:
      return 'Mode Testnet';
    case 11155111:
      return 'Ethereum Sepolia';
    default:
      return `Chain ${chainId}`;
  }
}

/**
 * Get all supported chain configurations
 */
export function getAllChainConfigs() {
  return CHAIN_CONFIGS;
}

/**
 * Get chain configuration for a specific chain
 */
export function getChainConfig(chainId: number): ChainConfig {
  if (!isSupportedChain(chainId)) {
    throw new Error(`Unsupported chain ID: ${chainId}. Supported chains: ${SUPPORTED_CHAIN_IDS.join(', ')}`);
  }
  return CHAIN_CONFIGS[chainId];
} 