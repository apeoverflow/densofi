import { Request, Response } from 'express';
import { ConnectionManager } from '../services/connection-manager.js';
import { domainEventListener } from '../services/domain-event-listener.js';
import { nftMinterEventListener } from '../services/nft-minter-event-listener.js';
import { DomainService } from '../services/domain-service.js';
import { walletAuthService } from '../services/wallet-auth-service.js';
import { logger } from '../utils/logger.js';
import { AdminAuthenticatedRequest } from '../middleware/auth.js';
import { ENV } from '../config/env.js';

export class DebugController {
  /**
   * Get service connection status
   */
  static getStatus(req: Request, res: Response) {
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
   * Get wallets associated with an IP address
   */
  static getWalletsForIP(req: Request, res: Response) {
    try {
      const { ip } = req.params;
      const wallets = walletAuthService.getWalletsForIP(ip);
      
      res.json({
        success: true,
        data: {
          ipAddress: ip,
          wallets,
          count: wallets.length
        }
      });
    } catch (error) {
      logger.error('Error fetching IP wallet associations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch IP wallet associations'
      });
    }
  }

  /**
   * Get authentication statistics
   */
  static getAuthStats(req: Request, res: Response) {
    try {
      const stats = walletAuthService.getAuthStats();
      
      res.json({
        success: true,
        data: {
          ...stats,
          currentIP: req.ip || req.connection.remoteAddress || 'unknown'
        }
      });
    } catch (error) {
      logger.error('Error fetching auth stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch authentication statistics'
      });
    }
  }

  /**
   * Trigger manual processing of pending events
   * Requires API key authentication
   */
  static async processPendingEvents(req: AdminAuthenticatedRequest, res: Response) {
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

  /**
   * Get all verified wallets with pagination (Admin only)
   * Requires API key authentication
   */
  static getAllWallets(req: AdminAuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const sortBy = req.query.sortBy as string || 'lastSeen';
      const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';

      const result = walletAuthService.getPaginatedWallets(page, limit, sortBy, order);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching paginated wallets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch wallet list'
      });
    }
  }

  /**
   * Get detailed wallet information (Admin only)
   * Requires API key authentication
   */
  static getWalletDetails(req: AdminAuthenticatedRequest, res: Response) {
    try {
      const { address } = req.params;
      const walletInfo = walletAuthService.getWalletInfo(address);
      
      if (!walletInfo) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found or never authenticated'
        });
      }

      // Convert Set to Array and add additional admin info
      const responseData = {
        ...walletInfo,
        ipAddresses: Array.from(walletInfo.ipAddresses),
        ipCount: walletInfo.ipAddresses.size,
        isRecent: new Date(Date.now() - 24 * 60 * 60 * 1000) < walletInfo.lastSeen,
        hasSuspiciousActivity: !!(walletInfo.suspiciousActivity && walletInfo.suspiciousActivity.length > 0)
      };

      res.json({
        success: true,
        data: responseData
      });
    } catch (error) {
      logger.error('Error fetching admin wallet details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch wallet details'
      });
    }
  }

  /**
   * Get detailed event listener status
   * Requires API key authentication
   */
  static async getEventListenerStatus(req: AdminAuthenticatedRequest, res: Response) {
    try {
      const status = {
        domainEventListener: {
          isListening: domainEventListener.getStatus(),
          lastActivity: 'unknown' // Could be enhanced to track last event time
        },
        nftMinterEventListener: {
          isListening: nftMinterEventListener.getStatus(),
          lastActivity: 'unknown' // Could be enhanced to track last event time
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
   * Get wallet authentication statistics (Admin only)
   * Requires API key authentication
   */
  static getWalletAuthStats(req: AdminAuthenticatedRequest, res: Response) {
    try {
      const stats = walletAuthService.getAdminStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error fetching admin wallet auth stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch wallet authentication statistics'
      });
    }
  }
}