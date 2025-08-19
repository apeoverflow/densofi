import { Request, Response } from 'express';
import { DomainService } from '../services/domain-service.js';
import { NFTMinterService } from '../services/nft-minter-service.js';
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
}