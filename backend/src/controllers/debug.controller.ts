import { Request, Response } from 'express';
import { ConnectionManager } from '../services/connection-manager.js';
import { DomainService } from '../services/domain-service.js';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';
import { requireApiKey, AuthenticatedRequest } from '../middleware/auth.js';
import { walletAuthService } from '../services/wallet-auth-service.js';

export class DebugController {
  /**
   * Get service connection status
   * @param req Express request object
   * @param res Express response object
   */
  static async getStatus(req: Request, res: Response) {
    try {
      const status = ConnectionManager.getStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting service status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get service status'
      });
    }
  }

  /**
   * Get wallet authentication debug information
   * @param req Express request object
   * @param res Express response object
   */
  static async getWalletAuthStatus(req: AuthenticatedRequest, res: Response) {
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

      const walletInfo = await walletAuthService.getWalletInfo(walletAddress);
      
      if (!walletInfo) {
        // Let's also check all stored wallets for debugging
        const allStats = await walletAuthService.getAdminStats();
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
   * Get detailed event listener status
   * @param req Express request object
   * @param res Express response object
   */
  static async getEventListenersStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const status = {
        domainEventListener: {
          enabled: ENV.ENABLE_EVENT_LISTENERS,
          status: 'running'
        },
        nftMinterEventListener: {
          enabled: ENV.ENABLE_EVENT_LISTENERS,
          status: 'running'
        }
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Error getting event listener status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get event listener status'
      });
    }
  }

  /**
   * Process pending events manually
   * @param req Express request object
   * @param res Express response object
   */
  static async processPending(req: AuthenticatedRequest, res: Response) {
    try {
      await DomainService.processPendingRegistrations();
      await DomainService.processPendingOwnershipUpdates();
      
      const responseMessage = ENV.ENABLE_EVENT_LISTENERS 
        ? 'Pending events processed successfully'
        : 'Pending events processed successfully (Note: Event listeners are disabled - events must be processed manually)';
      
      res.json({
        success: true,
        message: responseMessage,
        eventListenersEnabled: ENV.ENABLE_EVENT_LISTENERS
      });
    } catch (error) {
      logger.error('Error processing pending events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process pending events'
      });
    }
  }
}
