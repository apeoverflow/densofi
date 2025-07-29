import { Request, Response } from 'express';
import { walletAuthService } from '../services/wallet-auth-service.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  /**
   * Check wallet authentication status
   * Does what the /debug/wallet-auth endpoint currently does
   * Uses JWT to ensure the user account is actually the users authenticated account
   */
  static checkAuthStatus(req: Request, res: Response) {
    try {
      const walletAddress = req.headers['x-wallet-address'] as string;
      const authHeader = req.headers.authorization;
      
      const debugInfo = {
        providedWalletAddress: walletAddress,
        normalizedWalletAddress: walletAddress ? walletAddress.toLowerCase() : null,
        authorizationHeader: authHeader ? authHeader.substring(0, 20) + '...' : null,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
      };

      if (!walletAddress) {
        return res.json({
          success: false,
          debug: debugInfo,
          error: 'No X-Wallet-Address header provided'
        });
      }

      const walletInfo = walletAuthService.getWalletInfo(walletAddress);
      
      if (!walletInfo) {
        // Let's also check all stored wallets for debugging
        const allStats = walletAuthService.getAdminStats();
        return res.json({
          success: false,
          debug: {
            ...debugInfo,
            walletNotFound: true,
            totalStoredWallets: allStats.totalWallets,
            storedWalletsPreview: allStats.topWallets.slice(0, 3).map(w => ({
              address: w.walletAddress,
              lastSeen: w.lastSeen
            }))
          },
          error: 'Wallet not found in authenticated registry'
        });
      }

      // Check authentication freshness
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const isAuthValid = walletInfo.lastSeen >= twentyFourHoursAgo;

      return res.json({
        success: true,
        debug: debugInfo,
        walletInfo: {
          walletAddress: walletInfo.walletAddress,
          lastSeen: walletInfo.lastSeen,
          firstSeen: walletInfo.firstSeen,
          signInCount: walletInfo.signInCount,
          ipCount: walletInfo.ipAddresses.size,
          isAuthValid,
          timeSinceLastSeen: Date.now() - walletInfo.lastSeen.getTime()
        }
      });
    } catch (error) {
      logger.error('Debug wallet auth error:', error);
      res.status(500).json({
        success: false,
        error: 'Debug endpoint error'
      });
    }
  }

  /**
   * Request message to sign for wallet authentication
   */
  static requestMessage(req: Request, res: Response) {
    try {
      const authData = walletAuthService.generateAuthMessage();
      
      res.json({
        success: true,
        data: authData
      });
    } catch (error) {
      logger.error('Error generating auth message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate authentication message'
      });
    }
  }

  /**
   * Verify wallet signature and authenticate user
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
   */
  static getWalletInfo(req: Request, res: Response) {
    try {
      const { address } = req.params;
      const walletInfo = walletAuthService.getWalletInfo(address);
      
      if (!walletInfo) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found or never authenticated'
        });
      }

      // Convert Set to Array for JSON response
      const responseData = {
        ...walletInfo,
        ipAddresses: Array.from(walletInfo.ipAddresses)
      };

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      logger.error('Error fetching wallet info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch wallet information'
      });
    }
  }
}