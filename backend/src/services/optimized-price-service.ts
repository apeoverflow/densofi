import { parseAbiItem } from 'viem';
import { publicClient } from './viem-client.js';
import { CONTRACT_ADDRESSES, LAUNCHPAD_ABI, getContractAddresses } from '../config/contracts.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface TokenPriceData {
  tokenAddress: string;
  currentPrice: number;
  volume24h: number;
  change24h: number;
  isActive: boolean;
  vaultAddress?: string;
}

interface CachedPriceData extends TokenPriceData {
  cachedAt: Date;
  expiresAt: Date;
}

export class OptimizedPriceService {
  private static launchpadAddress: `0x${string}` | null = null;
  private static priceCache = new Map<string, CachedPriceData>();
  private static CACHE_DURATION = 30 * 1000; // 30 seconds cache
  private static currentBlock: bigint | null = null;
  private static blockCacheTime: number = 0;

  /**
   * Initialize the optimized price service
   */
  static initialize(): void {
    const addresses = getContractAddresses();
    if (addresses?.addresses.launchpad) {
      this.launchpadAddress = addresses.addresses.launchpad as `0x${string}`;
      logger.info(`Optimized price service initialized with launchpad: ${this.launchpadAddress}`);
    }
  }

  /**
   * Get cached current block number (refresh every 10 seconds)
   */
  private static async getCurrentBlock(): Promise<bigint> {
    const now = Date.now();
    if (this.currentBlock && (now - this.blockCacheTime) < 10000) {
      return this.currentBlock;
    }

    this.currentBlock = await publicClient.getBlockNumber();
    this.blockCacheTime = now;
    return this.currentBlock;
  }

  /**
   * Batch get pool info for multiple tokens in parallel
   */
  private static async batchGetPoolInfo(tokenAddresses: string[]): Promise<Map<string, any>> {
    if (!this.launchpadAddress) {
      return new Map();
    }

    const poolInfoPromises = tokenAddresses.map(async (tokenAddress) => {
      try {
        const poolInfo = await publicClient.readContract({
          address: this.launchpadAddress!,
          abi: LAUNCHPAD_ABI,
          functionName: 'getPoolInfo',
          args: [tokenAddress]
        }) as [bigint, bigint, bigint, string, number, boolean];

        return {
          tokenAddress,
          ethReserve: poolInfo[0],
          tokenReserve: poolInfo[1],
          fakeEth: poolInfo[2],
          creator: poolInfo[3],
          sellPenalty: poolInfo[4],
          locked: poolInfo[5]
        };
      } catch (error) {
        logger.error(`Error fetching pool info for ${tokenAddress}:`, error);
        return { tokenAddress, ethReserve: 0n, tokenReserve: 0n };
      }
    });

    const results = await Promise.all(poolInfoPromises);
    const poolInfoMap = new Map();
    
    results.forEach(result => {
      poolInfoMap.set(result.tokenAddress, result);
    });

    return poolInfoMap;
  }

  /**
   * Batch get trading events for multiple tokens
   */
  private static async batchGetTradingEvents(tokenAddresses: string[]): Promise<Map<string, { volume: number; oldPrice: number }>> {
    if (!this.launchpadAddress || tokenAddresses.length === 0) {
      return new Map();
    }

    try {
      const currentBlock = await this.getCurrentBlock();
      const blocksIn24h = BigInt(24 * 60 * 60 / 2); // ~24h of blocks
      const fromBlock = currentBlock > blocksIn24h ? currentBlock - blocksIn24h : BigInt(1);

      // Get all buy and sell events for all tokens in parallel
      const [allBuyEvents, allSellEvents] = await Promise.all([
        // Buy events
        publicClient.getLogs({
          address: this.launchpadAddress,
          event: parseAbiItem('event Bought(address indexed buyer, address indexed token, uint256 ethIn, uint256 tokensOut, uint256 newPrice)'),
          fromBlock,
          toBlock: currentBlock,
        }),
        // Sell events  
        publicClient.getLogs({
          address: this.launchpadAddress,
          event: parseAbiItem('event Sold(address indexed seller, address indexed token, uint256 ethOut, uint256 tokensIn, uint256 newPrice)'),
          fromBlock,
          toBlock: currentBlock,
        })
      ]);

      // Process events by token
      const eventDataMap = new Map<string, { volume: number; oldPrice: number }>();

      tokenAddresses.forEach(tokenAddress => {
        const tokenBuyEvents = allBuyEvents.filter(event => 
          event.args?.token?.toLowerCase() === tokenAddress.toLowerCase()
        );
        const tokenSellEvents = allSellEvents.filter(event => 
          event.args?.token?.toLowerCase() === tokenAddress.toLowerCase()
        );

        // Calculate volume
        const buyVolume = tokenBuyEvents.reduce((sum, event) => 
          sum + Number(event.args?.ethIn || 0), 0
        );
        const sellVolume = tokenSellEvents.reduce((sum, event) => 
          sum + Number(event.args?.ethOut || 0), 0
        );
        const totalVolumeWei = buyVolume + sellVolume;

        // Get oldest price for 24h change calculation
        const allEvents = [...tokenBuyEvents, ...tokenSellEvents].sort((a, b) => 
          Number(a.blockNumber || 0) - Number(b.blockNumber || 0)
        );
        
        const oldPrice = allEvents.length > 0 ? Number(allEvents[0].args?.newPrice || 0) : 0;

        eventDataMap.set(tokenAddress, {
          volume: totalVolumeWei / 1e18,
          oldPrice
        });
      });

      return eventDataMap;

    } catch (error) {
      logger.error('Error batch fetching trading events:', error);
      return new Map();
    }
  }

  /**
   * Get optimized price data for multiple tokens in parallel
   */
  static async getTokensPriceData(tokenAddresses: string[]): Promise<Map<string, TokenPriceData>> {
    if (!this.launchpadAddress || tokenAddresses.length === 0) {
      return new Map();
    }

    const now = new Date();
    const results = new Map<string, TokenPriceData>();

    // Check cache first
    const uncachedTokens: string[] = [];
    tokenAddresses.forEach(tokenAddress => {
      const cached = this.priceCache.get(tokenAddress);
      if (cached && cached.expiresAt > now) {
        results.set(tokenAddress, cached);
      } else {
        uncachedTokens.push(tokenAddress);
      }
    });

    if (uncachedTokens.length === 0) {
      logger.debug(`All ${tokenAddresses.length} tokens served from cache`);
      return results;
    }

    logger.info(`Fetching fresh data for ${uncachedTokens.length}/${tokenAddresses.length} tokens`);

    try {
      // Fetch all data in parallel
      const [poolInfoMap, eventsMap] = await Promise.all([
        this.batchGetPoolInfo(uncachedTokens),
        this.batchGetTradingEvents(uncachedTokens)
      ]);

      // Process results
      uncachedTokens.forEach(tokenAddress => {
        const poolInfo = poolInfoMap.get(tokenAddress);
        const eventData = eventsMap.get(tokenAddress);

        let currentPrice = 0;
        if (poolInfo && poolInfo.ethReserve > 0 && poolInfo.tokenReserve > 0) {
          currentPrice = Number(poolInfo.ethReserve) / Number(poolInfo.tokenReserve);
        }

        const volume24h = eventData?.volume || 0;
        
        let change24h = 0;
        if (eventData?.oldPrice && eventData.oldPrice > 0 && currentPrice > 0) {
          change24h = ((currentPrice - eventData.oldPrice) / eventData.oldPrice) * 100;
        }

        const tokenData: TokenPriceData = {
          tokenAddress,
          currentPrice: currentPrice / 1e18, // Convert to ETH
          volume24h,
          change24h,
          isActive: currentPrice > 0
        };

        // Cache the result
        const cachedData: CachedPriceData = {
          ...tokenData,
          cachedAt: now,
          expiresAt: new Date(now.getTime() + this.CACHE_DURATION)
        };
        this.priceCache.set(tokenAddress, cachedData);
        results.set(tokenAddress, tokenData);
      });

      logger.info(`Successfully fetched price data for ${uncachedTokens.length} tokens`);
      return results;

    } catch (error) {
      logger.error('Error in batch price data fetch:', error);
      return results;
    }
  }

  /**
   * Get single token price data (uses cache if available)
   */
  static async getSingleTokenPriceData(tokenAddress: string): Promise<TokenPriceData> {
    const results = await this.getTokensPriceData([tokenAddress]);
    return results.get(tokenAddress) || {
      tokenAddress,
      currentPrice: 0,
      volume24h: 0,
      change24h: 0,
      isActive: false
    };
  }

  /**
   * Clear expired cache entries
   */
  static clearExpiredCache(): void {
    const now = new Date();
    let clearedCount = 0;
    
    for (const [key, value] of this.priceCache.entries()) {
      if (value.expiresAt <= now) {
        this.priceCache.delete(key);
        clearedCount++;
      }
    }
    
    if (clearedCount > 0) {
      logger.debug(`Cleared ${clearedCount} expired cache entries`);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      size: this.priceCache.size,
      entries: Array.from(this.priceCache.entries()).map(([key, value]) => ({
        token: key,
        cachedAt: value.cachedAt,
        expiresAt: value.expiresAt
      }))
    };
  }
}

// Initialize on import
OptimizedPriceService.initialize();

// Clear cache every minute
setInterval(() => {
  OptimizedPriceService.clearExpiredCache();
}, 60 * 1000);
