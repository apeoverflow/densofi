import { Request, Response } from 'express';
import { walletAuthService } from '../services/wallet-auth-service.js';
import { logger } from '../utils/logger.js';
import { WalletAuthenticatedRequest } from '../middleware/wallet-auth.js';

export class AuthController {
  /**
   * Get authentication status for the current user
   * @param req Express request object
   * @param res Express response object
   */
  static async getStatus(req: WalletAuthenticatedRequest, res: Response) {
    try {
      const authStatus = {
        isAuthenticated: !!req.wallet,
        walletAddress: req.wallet?.walletAddress || null,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      };

      res.json({
        success: true,
        data: authStatus
      });
    } catch (error) {
      logger.error('Error getting auth status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get authentication status'
      });
    }
  }

  /**
   * Request a signature message for wallet authentication
   * @param req Express request object
   * @param res Express response object
   */
  static async requestMessage(req: Request, res: Response) {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing walletAddress'
        });
      }

      const message = await walletAuthService.generateAuthMessage();
      
      res.json({
        success: true,
        data: {
          message,
          walletAddress
        }
      });
    } catch (error) {
      logger.error('Error generating signature message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate signature message'
      });
    }
  }

  /**
   * Verify wallet signature and authenticate user
   * @param req Express request object
   * @param res Express response object
   */
  static async verifySignature(req: Request, res: Response) {
    try {
      const { nonce, signature, walletAddress } = req.body;
      
      if (!nonce || !signature || !walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: nonce, signature, walletAddress'
        });
      }

      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      const authResult = await walletAuthService.verifySignature(
        { nonce, signature, walletAddress },
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        message: 'Wallet authenticated successfully',
        data: authResult
      });
    } catch (error) {
      logger.error('Error verifying wallet signature:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify signature'
      });
    }
  }

  /**
   * Get wallet authentication information
   * @param req Express request object
   * @param res Express response object
   */
  static async getWalletInfo(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const walletInfo = await walletAuthService.getWalletInfo(address);
      
      if (!walletInfo) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found'
        });
      }

      res.json({
        success: true,
        data: walletInfo
      });
    } catch (error) {
      logger.error('Error getting wallet info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get wallet info'
      });
    }
  }

  /**
   * Get wallets associated with an IP address
   * @param req Express request object
   * @param res Express response object
   */
  static async getWalletsForIP(req: Request, res: Response) {
    try {
      const { ip } = req.params;
      const wallets = await walletAuthService.getWalletsForIP(ip);
      
      res.json({
        success: true,
        data: wallets
      });
    } catch (error) {
      logger.error('Error getting wallets by IP:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get wallets by IP'
      });
    }
  }

  /**
   * Get authentication statistics
   * @param req Express request object
   * @param res Express response object
   */
  static async getAuthStats(req: Request, res: Response) {
    try {
      const stats = await walletAuthService.getAuthStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting auth stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get auth stats'
      });
    }
  }
}
