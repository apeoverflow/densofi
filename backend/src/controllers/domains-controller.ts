import { Request, Response } from 'express';
import { DomainService } from '../services/domain-service.js';
import { NFTMinterService } from '../services/nft-minter-service.js';
import { PriceService } from '../services/price-service.js';
import { OptimizedPriceService } from '../services/optimized-price-service.js';
import { logger } from '../utils/logger.js';

export class DomainsController {
  /**
   * Get all domains
   */
  static async getAllDomains(_req: Request, res: Response) {
    try {
      const domains = await DomainService.getAllDomains();
      res.json({
        success: true,
        data: domains,
        count: domains.length
      });
    } catch (error) {
      logger.error('Error fetching domains:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch domains'
      });
    }
  }

  /**
   * Get domain by name
   */
  static async getDomainByName(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const domain = await DomainService.getDomainByName(name);
      
      if (!domain) {
        return res.status(404).json({
          success: false,
          error: 'Domain not found'
        });
      }

      res.json({
        success: true,
        data: domain
      });
    } catch (error) {
      logger.error('Error fetching domain:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch domain'
      });
    }
  }

  /**
   * Check if domain is registered
   */
  static async getDomainStatus(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const isRegistered = await DomainService.isDomainRegistered(name);
      
      res.json({
        success: true,
        data: {
          domainName: name,
          isRegistered
        }
      });
    } catch (error) {
      logger.error('Error checking domain status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check domain status'
      });
    }
  }

  /**
   * Get NFTs owned by an address
   */
  static async getNFTsByAddress(req: Request, res: Response) {
    try {
      const { address } = req.params;
      
      // Validate address format
      if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid Ethereum address format'
        });
      }

      const nfts = await NFTMinterService.getNFTsForOwner(address as `0x${string}`);
      
      res.json({
        success: true,
        data: {
          address,
          nfts,
          count: nfts.length
        }
      });
    } catch (error) {
      logger.error('Error fetching NFTs for address:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch NFTs'
      });
    }
  }

  /**
   * Verify domain ownership via DNS
   */ 
  static async verifyDomainOwnership(req: Request, res: Response) {
    try {
      const { name, walletAddress } = req.params;
      
      const isVerified = await DomainService.verifyDomainViaDns(name, walletAddress);
      res.status(200).json({
        success: true,
        data: {
          domainName: name,
          walletAddress,
          isVerified
        }
      });
    } catch (error) {
      logger.error('Error verifying domain:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify domain'
      });
    }
  }

  /**
   * Get all domain tokens (optimized with pagination)
   */
  static async getAllTokens(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const startTime = Date.now();

      // Get all domains first (fast from MongoDB)
      const domains = await DomainService.getAllDomains();
      
      // Filter domains that have tokens (fast filtering)
      const domainsWithTokens = domains.filter(domain => 
        domain.Associated_ERC20_Addr && domain.Associated_ERC20_Addr !== ''
      );

      // Apply pagination to reduce contract calls
      const paginatedDomains = domainsWithTokens.slice(skip, skip + limit);
      
      // Get token addresses for batch processing
      const tokenAddresses = paginatedDomains.map(domain => domain.Associated_ERC20_Addr);

      // Batch fetch price data for all tokens in parallel (FAST!)
      const priceDataMap = await OptimizedPriceService.getTokensPriceData(tokenAddresses);

      // Transform to frontend format
      const tokens = paginatedDomains.map(domain => {
        const priceData = priceDataMap.get(domain.Associated_ERC20_Addr);
        
        return {
          id: domain._id,
          name: domain.Domain_Name,
          contractAddress: domain.Associated_ERC20_Addr,
          ownerAddress: domain.Verified_Owner_Addr,
          chainId: domain.Chain_Id.toString(),
          nftTokenId: domain.NFT_Token_Id,
          expirationDate: domain.Expiration_Timestamp,
          createdAt: domain.createdAt,
          updatedAt: domain.updatedAt,
          // Real data from optimized service
          currentPrice: priceData?.currentPrice || 0,
          change24h: priceData?.change24h || 0,
          volume24h: priceData?.volume24h || 0,
          totalLiquidity: (priceData?.currentPrice || 0) * 1000000,
          isActive: priceData?.isActive || false
        };
      });

      const loadTime = Date.now() - startTime;
      logger.info(`⚡ Fast fetch: ${tokens.length} tokens in ${loadTime}ms (page ${page}/${Math.ceil(domainsWithTokens.length / limit)})`);

      res.json({
        success: true,
        data: tokens,
        count: tokens.length,
        pagination: {
          page,
          limit,
          total: domainsWithTokens.length,
          totalPages: Math.ceil(domainsWithTokens.length / limit),
          hasNext: skip + limit < domainsWithTokens.length,
          hasPrev: page > 1
        },
        loadTime: `${loadTime}ms`
      });
    } catch (error) {
      logger.error('Error fetching tokens:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tokens'
      });
    }
  }

  /**
   * Get specific domain token by name (formatted for token detail page)
   */
  static async getTokenByName(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const domain = await DomainService.getDomainByName(name);
      
      if (!domain) {
        return res.status(404).json({
          success: false,
          error: 'Token not found'
        });
      }

      // Check if domain has a token
      const tokenAddress = domain.Associated_ERC20_Addr;
      if (!tokenAddress || tokenAddress === '') {
        return res.status(404).json({
          success: false,
          error: 'Domain has no associated token'
        });
      }

      // Get real price data using optimized service (faster!)
      const priceData = await OptimizedPriceService.getSingleTokenPriceData(tokenAddress);
      const tokenData = await PriceService.getTokenDataForDomain(domain.Domain_Name);

      // Transform domain data to detailed token format for frontend
      const token = {
        id: domain._id,
        name: domain.Domain_Name,
        contractAddress: tokenAddress,
        ownerAddress: domain.Verified_Owner_Addr,
        chainId: domain.Chain_Id.toString(),
        nftTokenId: domain.NFT_Token_Id,
        expirationDate: domain.Expiration_Timestamp,
        createdAt: domain.createdAt,
        updatedAt: domain.updatedAt,
        // Real data from optimized service
        currentPrice: priceData.currentPrice,
        change24h: priceData.change24h,
        volume24h: priceData.volume24h,
        // Calculated/estimated fields
        marketCap: priceData.currentPrice * 1000000000, // price * total supply
        circulatingSupply: 1000000000, // Standard token supply from contract
        totalSupply: 1000000000,
        totalLiquidity: priceData.currentPrice * 1000000, // Rough estimate
        isActive: priceData.isActive,
        registrationDate: domain.createdAt,
        subdomainCount: 0, // Could be enhanced with subdomain tracking
        vaultAddress: tokenData?.vaultAddress || null
      };

      logger.info(`Fetched detailed token data for ${name}: price=${token.currentPrice} ETH, volume=${token.volume24h} ETH`);

      res.json({
        success: true,
        data: token
      });
    } catch (error) {
      logger.error('Error fetching token:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch token'
      });
    }
  }
}