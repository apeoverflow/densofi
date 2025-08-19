import { parseAbiItem } from 'viem';
import { publicClient } from './viem-client.js';
import { CONTRACT_ADDRESSES, LAUNCHPAD_ABI, getContractAddresses } from '../config/contracts.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface PoolInfo {
  ethReserve: bigint;
  tokenReserve: bigint;
  fakeEth: bigint;
  creator: string;
  sellPenalty: number;
  locked: boolean;
}

interface TokenData {
  tokenAddress: string | null;
  vaultAddress: string | null;
  isLaunched: boolean;
  poolAddress: string | null;
}

export class PriceService {
  private static launchpadAddress: `0x${string}` | null = null;

  /**
   * Initialize the price service
   */
  static initialize(): void {
    const addresses = getContractAddresses();
    if (addresses?.addresses.launchpad) {
      this.launchpadAddress = addresses.addresses.launchpad as `0x${string}`;
      logger.info(`Price service initialized with launchpad: ${this.launchpadAddress}`);
    } else {
      logger.warn('Price service: No launchpad address found for current chain');
    }
  }

  /**
   * Get token data for a specific domain from launchpad contract
   */
  static async getTokenDataForDomain(domainName: string): Promise<TokenData | null> {
    if (!this.launchpadAddress) {
      logger.error('Price service not initialized or no launchpad address');
      return null;
    }

    try {
      // Query the launchpad contract for vault address
      const vaultAddress = await publicClient.readContract({
        address: this.launchpadAddress,
        abi: LAUNCHPAD_ABI,
        functionName: 'getVaultByDomain',
        args: [domainName]
      }) as string;

      if (!vaultAddress || vaultAddress === '0x0000000000000000000000000000000000000000') {
        logger.debug(`No vault found for domain: ${domainName}`);
        return null; // Domain not tokenized yet
      }

      return {
        vaultAddress,
        isLaunched: true,
        tokenAddress: null, // We'll need to get this from the vault or events
        poolAddress: null // We'll need to get this from the vault or events
      };
    } catch (error) {
      logger.error(`Error fetching token data for domain ${domainName}:`, error);
      return null;
    }
  }

  /**
   * Get current price from launchpad fake pool
   */
  static async getCurrentPriceFromFakePool(tokenAddress: string): Promise<number> {
    if (!this.launchpadAddress) {
      logger.error('Price service not initialized');
      return 0;
    }

    try {
      const poolInfo = await publicClient.readContract({
        address: this.launchpadAddress,
        abi: LAUNCHPAD_ABI,
        functionName: 'getPoolInfo',
        args: [tokenAddress]
      }) as [bigint, bigint, bigint, string, number, boolean];

      const [ethReserve, tokenReserve, fakeEth, creator, sellPenalty, locked] = poolInfo;

      if (ethReserve > 0 && tokenReserve > 0) {
        // Calculate price from fake pool reserves: ETH per token
        const priceInWei = Number(ethReserve) / Number(tokenReserve);
        return priceInWei; // Return in wei, will be converted to ETH in frontend
      }

      return 0;
    } catch (error) {
      logger.error(`Error fetching price from fake pool for token ${tokenAddress}:`, error);
      return 0;
    }
  }

  /**
   * Calculate 24h volume from recent Buy/Sell events
   */
  static async get24hVolume(tokenAddress: string): Promise<number> {
    if (!this.launchpadAddress) {
      logger.error('Price service not initialized');
      return 0;
    }

    try {
      const currentBlock = await publicClient.getBlockNumber();
      // Approximate 24h of blocks (assuming ~2 second block time on Flow)
      const blocksIn24h = BigInt(24 * 60 * 60 / 2); // 43200 blocks
      const fromBlock = currentBlock > blocksIn24h ? currentBlock - blocksIn24h : BigInt(1);

      // Get recent Buy events
      const buyEvents = await publicClient.getLogs({
        address: this.launchpadAddress,
        event: parseAbiItem('event Bought(address indexed buyer, address indexed token, uint256 ethIn, uint256 tokensOut, uint256 newPrice)'),
        args: { token: tokenAddress as `0x${string}` },
        fromBlock,
        toBlock: currentBlock,
      });

      // Get recent Sell events
      const sellEvents = await publicClient.getLogs({
        address: this.launchpadAddress,
        event: parseAbiItem('event Sold(address indexed seller, address indexed token, uint256 ethOut, uint256 tokensIn, uint256 newPrice)'),
        args: { token: tokenAddress as `0x${string}` },
        fromBlock,
        toBlock: currentBlock,
      });

      // Calculate total volume in ETH
      const buyVolume = buyEvents.reduce((sum, event) => {
        return sum + Number(event.args?.ethIn || 0);
      }, 0);

      const sellVolume = sellEvents.reduce((sum, event) => {
        return sum + Number(event.args?.ethOut || 0);
      }, 0);

      const totalVolumeWei = buyVolume + sellVolume;
      return totalVolumeWei / 1e18; // Convert wei to ETH

    } catch (error) {
      logger.error(`Error calculating 24h volume for token ${tokenAddress}:`, error);
      return 0;
    }
  }

  /**
   * Calculate 24h price change
   */
  static async get24hPriceChange(tokenAddress: string, currentPrice: number): Promise<number> {
    if (!this.launchpadAddress) {
      return 0;
    }

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const blocksIn24h = BigInt(24 * 60 * 60 / 2); // Approximate 24h of blocks
      const fromBlock = currentBlock > blocksIn24h ? currentBlock - blocksIn24h : BigInt(1);

      // Get the earliest price event from 24h ago
      const earlyEvents = await publicClient.getLogs({
        address: this.launchpadAddress,
        event: parseAbiItem('event Bought(address indexed buyer, address indexed token, uint256 ethIn, uint256 tokensOut, uint256 newPrice)'),
        args: { token: tokenAddress as `0x${string}` },
        fromBlock,
        toBlock: fromBlock + BigInt(100), // Look at first 100 blocks from 24h ago
      });

      if (earlyEvents.length > 0) {
        const oldPriceWei = Number(earlyEvents[0].args?.newPrice || 0);
        const currentPriceWei = currentPrice;
        
        if (oldPriceWei > 0) {
          return ((currentPriceWei - oldPriceWei) / oldPriceWei) * 100;
        }
      }

      // If no events found, return 0 change
      return 0;

    } catch (error) {
      logger.error(`Error calculating 24h price change for token ${tokenAddress}:`, error);
      return 0;
    }
  }

  /**
   * Get all domains that have associated tokens
   */
  static async getDomainsWithTokens(domains: any[]): Promise<any[]> {
    const domainsWithTokens = await Promise.all(
      domains.map(async (domain) => {
        // For now, check if Associated_ERC20_Addr is set
        if (domain.Associated_ERC20_Addr && domain.Associated_ERC20_Addr !== '') {
          const tokenAddress = domain.Associated_ERC20_Addr;
          
          // Get real price and volume data
          const currentPrice = await this.getCurrentPriceFromFakePool(tokenAddress);
          const volume24h = await this.get24hVolume(tokenAddress);
          const change24h = await this.get24hPriceChange(tokenAddress, currentPrice);

          return {
            ...domain,
            tokenAddress,
            currentPrice: currentPrice / 1e18, // Convert wei to ETH
            volume24h,
            change24h,
            hasRealData: true
          };
        } else {
          // Check if domain has a vault (might be tokenized but not in Associated_ERC20_Addr)
          const tokenData = await this.getTokenDataForDomain(domain.Domain_Name);
          
          return {
            ...domain,
            tokenAddress: null,
            currentPrice: 0,
            volume24h: 0,
            change24h: 0,
            hasRealData: false,
            vaultAddress: tokenData?.vaultAddress || null
          };
        }
      })
    );

    return domainsWithTokens;
  }
}

// Initialize on import
PriceService.initialize();
