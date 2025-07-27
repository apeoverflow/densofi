import { Request, Response } from 'express';
import { ConnectionManager } from '../services/connection-manager.js';
import { DomainService } from '../services/domain-service.js';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';
import { requireApiKey, AuthenticatedRequest } from '../middleware/auth.js';

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
   * Trigger manual processing of pending events
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
