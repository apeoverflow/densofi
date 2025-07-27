import express from 'express';
import { logger } from '../utils/logger.js';
import { DomainService } from '../services/domain-service.js';
import { walletAuthService } from '../services/wallet-auth-service.js';
import { AuthenticatedRequest, requireApiKey } from '../middleware/auth.js';
import { WalletAuthenticatedRequest } from '../middleware/wallet-auth.js';

export class AdminController {


  /**
   * Get wallet authentication statistics
   * @param {AuthenticatedRequest} req - Express request object with auth
   * @param {express.Response} res - Express response object
   * @returns {Promise<void>} - Returns response with wallet auth stats
   * @throws {Error} - Throws if stats retrieval fails
   */
  static async getWalletAuthStats(req: AuthenticatedRequest, res: express.Response) {
    try {
      if (!req.isAuthenticated) {
        return res.status(403).json({
          success: false,
          error: 'Admin authentication required'
        });
      }

      const stats = walletAuthService.getAdminStats();
      
      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Error getting wallet auth stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get wallet auth stats'
      });
    }
  }

  /**
   * Get all wallets
   * @param {AuthenticatedRequest} req - Express request object with auth
   * @param {express.Response} res - Express response object
   * @returns {Promise<void>} - Returns response with wallet list
   * @throws {Error} - Throws if wallet retrieval fails
   */
  static async getWallets(req: AuthenticatedRequest, res: express.Response) {
    try {
      if (!req.isAuthenticated) {
        return res.status(403).json({
          success: false,
          error: 'Admin authentication required'
        });
      }

      const wallets = await DomainService.getAllDomains();
      
      res.json({
        success: true,
        data: wallets
      });
      
    } catch (error) {
      logger.error('Error getting wallets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get wallets'
      });
    }
  }

  /**
   * Get specific wallet details
   * @param {AuthenticatedRequest} req - Express request object with auth
   * @param {express.Response} res - Express response object
   * @param {string} req.params.address - Wallet address to retrieve
   * @returns {Promise<void>} - Returns response with wallet details
   * @throws {Error} - Throws if wallet retrieval fails
   */
  static async getWallet(req: AuthenticatedRequest, res: express.Response) {
    try {
      if (!req.isAuthenticated) {
        return res.status(403).json({
          success: false,
          error: 'Admin authentication required'
        });
      }

      const { address } = req.params;
      const wallet = await DomainService.getDomainByName(address);
      
      res.json({
        success: true,
        data: wallet
      });
      
    } catch (error) {
      logger.error('Error getting wallet:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get wallet'
      });
    }
  }
}
