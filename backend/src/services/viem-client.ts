import { createPublicClient, http, Chain } from 'viem';
import { sepolia } from 'viem/chains';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Define Flow network chain configuration
const flowMainnet: Chain = {
  id: 747,
  name: 'Flow',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.evm.nodes.onflow.org'],
    },
    public: {
      http: ['https://mainnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: { name: 'Flow Explorer', url: 'https://evm.flowscan.io' },
  },
};

// Get chain configuration based on chain ID
function getChainConfig(): Chain | undefined {
  const chainId = ENV.CHAIN_ID;
  
  switch (chainId) {
    case '11155111':
      return sepolia;
    case '747':
      return flowMainnet;
    default:
      logger.warn(`Unsupported chain ID: ${chainId}. Using generic configuration.`);
      return undefined;
  }
}

// Create public client with dynamic chain configuration
export const publicClient = createPublicClient({
  chain: getChainConfig(),
  transport: http(ENV.RPC_URL, {
    retryCount: 3,
    retryDelay: 1000,
  }),
});

// Test client connection
export async function testConnection(): Promise<boolean> {
  try {
    const blockNumber = await publicClient.getBlockNumber();
    const chainId = await publicClient.getChainId();
    const chainName = getChainConfig()?.name || 'Unknown';
    
    logger.info(`✅ Connected to ${chainName} network (Chain ID: ${chainId}). Latest block: ${blockNumber}`);
    return true;
  } catch (error) {
    logger.error(`❌ Failed to connect to network (Chain ID: ${ENV.CHAIN_ID}):`, error);
    return false;
  }
}

// Check if current network supports event filtering
export function supportsEventFiltering(): boolean {
  const chainId = ENV.CHAIN_ID;
  
  // Known chains that support reliable event filtering
  const supportedChains = ['11155111']; // Sepolia
  
  return supportedChains.includes(chainId);
}

// Check if network supports event listening (including Flow with polling)
export function supportsEventListening(): boolean {
  const chainId = ENV.CHAIN_ID;
  
  // Chains that support event listening (either filtering or polling)
  const supportedChains = ['11155111', '747']; // Sepolia, Flow
  
  return supportedChains.includes(chainId);
}

// Check if network needs polling-based event listening instead of filters
export function needsPollingForEvents(): boolean {
  const chainId = ENV.CHAIN_ID;
  
  // Networks that need polling instead of filter-based event listening
  const pollingChains = ['747']; // Flow
  
  return pollingChains.includes(chainId);
}

export default publicClient; 