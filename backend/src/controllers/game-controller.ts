import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import { WalletAuthenticatedRequest } from '../middleware/wallet-auth.js';

export class GameController {
  /**
   * Submit game XP score
   * Requires wallet authentication
   */
  static async submitXP(req: WalletAuthenticatedRequest, res: Response) {
    try {
      const { score, gameType = 'dino-runner', difficulty = 'normal' } = req.body;
      
      if (!req.walletAddress || !req.isWalletAuthenticated) {
        return res.status(401).json({
          success: false,
          error: 'Wallet authentication required - please provide valid JWT token'
        });
      }
      
      if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid score: must be a non-negative number'
        });
      }

      const walletAddress = req.walletAddress;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');

      // Submit XP to database and update player stats
      const { GameService } = await import('../services/game-service.js');
      const result = await GameService.submitXP(
        walletAddress,
        score,
        gameType,
        difficulty,
        ipAddress,
        userAgent
      );

      const response = {
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
      };

      res.json(response);
      
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
   * Public endpoint
   */
  static async getLeaderboard(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      
      const { GameService } = await import('../services/game-service.js');
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
   * Public endpoint
   */
  static async getGameStats(req: Request, res: Response) {
    try {
      const { GameService } = await import('../services/game-service.js');
      const stats = await GameService.getXPStats();

      res.json({
        success: true,
        data: stats
      });
      
    } catch (error) {
      logger.error('Error fetching game stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game statistics'
      });
    }
  }

  /**
   * Get player stats
   * Requires wallet authentication or admin override
   */
  static async getPlayerStats(req: WalletAuthenticatedRequest, res: Response) {
    try {
      const requestedAddress = req.params.address;
      const authenticatedAddress = req.walletAddress; // Use JWT-derived wallet address
      const isAdmin = req.isAdminAuthenticated;

      // Determine which address to get stats for
      let targetAddress: string;
      
      if (requestedAddress) {
        // If a specific address is requested, check permissions
        if (!isAdmin && authenticatedAddress !== requestedAddress.toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: 'Can only view your own stats unless admin'
          });
        }
        targetAddress = requestedAddress;
      } else {
        // No specific address requested, use authenticated wallet
        if (!authenticatedAddress) {
          return res.status(401).json({
            success: false,
            error: 'Wallet authentication required to view stats'
          });
        }
        targetAddress = authenticatedAddress;
      }

      // Get player stats from database
      const { GameService } = await import('../services/game-service.js');
      const stats = await GameService.getPlayerStats(targetAddress);

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Player stats not found. Play a game first to generate stats!'
        });
      }

      // Calculate current rank (simplified - could be optimized with aggregation)
      const leaderboard = await GameService.getLeaderboard(1000); // Get top 1000 to find rank
      const currentRank = leaderboard.findIndex(entry => 
        entry.walletAddress.toLowerCase() === targetAddress.toLowerCase()
      ) + 1;

      const response = {
        walletAddress: stats.walletAddress,
        totalXP: stats.totalXP,
        gamesPlayed: stats.gamesPlayed,
        highScore: stats.highScore,
        averageScore: stats.averageScore,
        totalPlayTime: `${Math.floor(stats.totalPlayTime / 3600)}h ${Math.floor((stats.totalPlayTime % 3600) / 60)}m`,
        achievementsUnlocked: stats.achievementsUnlocked,
        currentRank: currentRank || 'Unranked',
        lastPlayed: stats.lastPlayed,
        createdAt: stats.createdAt
      };

      res.json({
        success: true,
        data: response
      });
      
    } catch (error) {
      logger.error('Error fetching player stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch player stats'
      });
    }
  }

  /**
   * Get player game history
   * Requires wallet authentication or admin override
   */
  static async getPlayerGameHistory(req: WalletAuthenticatedRequest, res: Response) {
    try {
      const requestedAddress = req.params.address;
      const authenticatedAddress = req.walletAddress; // Use JWT-derived wallet address
      const isAdmin = req.isAdminAuthenticated;

      // Determine which address to get history for
      let targetAddress: string;
      
      if (requestedAddress) {
        // If a specific address is requested, check permissions
        if (!isAdmin && authenticatedAddress !== requestedAddress.toLowerCase()) {
          return res.status(403).json({
            success: false,
            error: 'Can only view your own game history unless admin'
          });
        }
        targetAddress = requestedAddress;
      } else {
        // No specific address requested, use authenticated wallet
        if (!authenticatedAddress) {
          return res.status(401).json({
            success: false,
            error: 'Wallet authentication required to view game history'
          });
        }
        targetAddress = authenticatedAddress;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      // Get player game history from database
      const { GameService } = await import('../services/game-service.js');
      const history = await GameService.getPlayerGameHistory(targetAddress, limit, offset);

      res.json({
        success: true,
        data: {
          history,
          pagination: {
            limit,
            offset,
            hasMore: history.length === limit
          }
        }
      });
      
    } catch (error) {
      logger.error('Error fetching player game history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch player game history'
      });
    }
  }
}