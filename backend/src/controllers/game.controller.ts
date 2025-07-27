import express from 'express';
import { logger } from '../utils/logger.js';
import { GameService } from '../services/game-service.js';
import { WalletAuthenticatedRequest } from '../middleware/wallet-auth.js';

export class GameController {
  /**
   * Submit game XP score for a player
   * @param {WalletAuthenticatedRequest} req - Express request object with wallet auth
   * @param {express.Response} res - Express response object
   * @param {number} req.body.score - The game score to submit
   * @param {string} [req.body.gameType='dino-runner'] - Type of game played
   * @param {string} [req.body.difficulty='normal'] - Game difficulty level
   * @returns {Promise<void>} - Returns response with XP submission details
   * @throws {Error} - Throws if score is invalid or wallet auth fails
   */
  static async submitXP(req: WalletAuthenticatedRequest, res: express.Response) {
    try {
      const { score, gameType = 'dino-runner', difficulty = 'normal' } = req.body;
      
      if (!req.wallet?.walletAddress) {
        return res.status(401).json({
          success: false,
          error: 'Wallet authentication required'
        });
      }
      
      if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid score: must be a non-negative number'
        });
      }

      const walletAddress = req.wallet.walletAddress.toLowerCase();
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result = await GameService.submitXP(
        walletAddress,
        score,
        gameType,
        difficulty,
        ipAddress,
        userAgent
      );

      res.json({
        success: true,
        data: {
          walletAddress,
          score,
          xpEarned: result.xpEarned,
          totalXP: result.totalXP,
          newHighScore: result.newHighScore,
          gameType,
          difficulty,
          timestamp: new Date().toISOString(),
          message: `Successfully earned ${result.xpEarned} XP! Total: ${result.totalXP}${result.newHighScore ? ' (New High Score!)' : ''}`
        }
      });
      
    } catch (error) {
      logger.error('Error submitting game XP:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit XP score'
      });
    }
  }

  /**
   * Get player XP leaderboard
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @param {number} [req.query.limit=10] - Number of players to show in leaderboard
   * @returns {Promise<void>} - Returns response with leaderboard data
   * @throws {Error} - Throws if leaderboard retrieval fails
   */
  static async getLeaderboard(req: express.Request, res: express.Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const leaderboard = await GameService.getLeaderboard(limit);
      const totalPlayers = await GameService.getTotalPlayers();

      res.json({
        success: true,
        data: {
          leaderboard,
          totalPlayers,
          lastUpdated: new Date().toISOString()
        }
      });
      
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard'
      });
    }
  }

  /**
   * Get overall game statistics
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @returns {Promise<void>} - Returns response with game statistics
   * @throws {Error} - Throws if statistics retrieval fails
   */
  static async getGameStats(req: express.Request, res: express.Response) {
    try {
      const stats = await GameService.getXPStats();

      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Error fetching game statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game statistics'
      });
    }
  }

  /**
   * Get player statistics
   * @param {WalletAuthenticatedRequest} req - Express request object with wallet auth
   * @param {express.Response} res - Express response object
   * @param {string} [req.params.address] - Optional Ethereum address to view stats for
   * @returns {Promise<void>} - Returns response with player statistics
   * @throws {Error} - Throws if wallet auth fails or permission denied
   */
  static async getPlayerStats(req: WalletAuthenticatedRequest, res: express.Response) {
    try {
      const { address } = req.params;
      const authenticatedAddress = req.wallet?.walletAddress;
      let targetAddress = authenticatedAddress;

      if (!authenticatedAddress) {
        return res.status(401).json({
          success: false,
          error: 'Wallet authentication required to view stats'
        });
      }

      if (address) {
        const requestedAddress = address.toLowerCase();
        // Admin can view any player's stats
        if (req.isAdminAuthenticated) {
          targetAddress = requestedAddress;
        } else if (requestedAddress !== authenticatedAddress?.toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: 'Can only view your own stats unless admin'
          });
        }
      }

      if (!targetAddress) {
        return res.status(400).json({
          success: false,
          error: 'No wallet address provided'
        });
      }

      const stats = await GameService.getPlayerStats(targetAddress.toLowerCase());

      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Error fetching player stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch player statistics'
      });
    }
  }

  /**
   * Get player game history
   * @param {WalletAuthenticatedRequest} req - Express request object with wallet auth
   * @param {express.Response} res - Express response object
   * @param {string} [req.params.address] - Optional Ethereum address to view history for
   * @param {number} [req.query.limit=20] - Number of history entries to return per page
   * @param {number} [req.query.offset=0] - Offset for pagination
   * @returns {Promise<void>} - Returns response with player game history
   * @throws {Error} - Throws if wallet auth fails or permission denied
   */
  static async getGameHistory(req: WalletAuthenticatedRequest, res: express.Response) {
    try {
      const { address } = req.params;
      const authenticatedAddress = req.wallet?.walletAddress;
      const isAdmin = req.isAdminAuthenticated;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!authenticatedAddress) {
        return res.status(401).json({
          success: false,
          error: 'Wallet authentication required to view history'
        });
      }

      let targetAddress = authenticatedAddress;

      if (address) {
        const requestedAddress = address.toLowerCase();
        // Admin can view any player's history
        if (isAdmin) {
          targetAddress = requestedAddress;
        } else if (requestedAddress !== authenticatedAddress?.toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: 'Can only view your own history unless admin'
          });
        }
      } else if (!authenticatedAddress) {
        return res.status(401).json({
          success: false,
          error: 'Wallet authentication required to view history'
        });
      }

      const history = await GameService.getPlayerGameHistory(targetAddress.toLowerCase(), limit, offset);

      res.json({
        success: true,
        data: {
          history: history,
          limit: limit,
          offset: offset,
          total: history.length
        }
      });
      
    } catch (error) {
      logger.error('Error fetching game history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game history'
      });
    }
  }
}
