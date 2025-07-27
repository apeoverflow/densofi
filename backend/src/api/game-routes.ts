import express from 'express';
import { logger } from '../utils/logger.js';
import { requireWalletAuth, optionalWalletAuth, WalletAuthenticatedRequest } from '../middleware/wallet-auth.js';
import { ENV } from '../config/env.js';

// Export all game route handlers as named functions
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
export const submitXP = async (req: WalletAuthenticatedRequest, res: express.Response) => {
  try {
    const { score, gameType = 'dino-runner', difficulty = 'normal' } = req.body;
    
    if (!req.wallet) {
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

    const walletAddress = req.wallet.walletAddress;
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
};

/**
 * Get player XP leaderboard
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {number} [req.query.limit=10] - Number of players to show in leaderboard
 * @returns {Promise<void>} - Returns response with leaderboard data
 * @throws {Error} - Throws if leaderboard retrieval fails
 */
export const getLeaderboard = async (req: express.Request, res: express.Response) => {
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
};

/**
 * Get overall game statistics
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @returns {Promise<void>} - Returns response with game statistics
 * @throws {Error} - Throws if statistics retrieval fails
 */
export const getGameStats = async (req: express.Request, res: express.Response) => {
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
};

/**
 * Get player statistics
 * @param {WalletAuthenticatedRequest} req - Express request object with wallet auth
 * @param {express.Response} res - Express response object
 * @param {string} [req.params.address] - Optional Ethereum address to view stats for
 * @returns {Promise<void>} - Returns response with player statistics
 * @throws {Error} - Throws if wallet auth fails or permission denied
 */
export const getPlayerStats = async (req: WalletAuthenticatedRequest, res: express.Response) => {
  try {
    const requestedAddress = req.params.address;
    const authenticatedAddress = req.wallet?.walletAddress;
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

    const { GameService } = await import('../services/game-service.js');
    const stats = await GameService.getPlayerStats(targetAddress);

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
};

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
export const getGameHistory = async (req: WalletAuthenticatedRequest, res: express.Response) => {
  try {
    const requestedAddress = req.params.address;
    const authenticatedAddress = req.wallet?.walletAddress;
    const isAdmin = req.isAdminAuthenticated;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Determine which address to get history for
    let targetAddress: string;
    
    if (requestedAddress) {
      // If a specific address is requested, check permissions
      if (!isAdmin && authenticatedAddress !== requestedAddress.toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: 'Can only view your own history unless admin'
        });
      }
      targetAddress = requestedAddress;
    } else {
      // No specific address requested, use authenticated wallet
      if (!authenticatedAddress) {
        return res.status(401).json({
          success: false,
          error: 'Wallet authentication required to view history'
        });
      }
      targetAddress = authenticatedAddress;
    }

    const { GameService } = await import('../services/game-service.js');
    const history = await GameService.getPlayerGameHistory(targetAddress, limit, offset);

    res.json({
      success: true,
      data: {
        history,
        limit,
        offset,
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
};

// Create router and mount routes
const router = express.Router();

router.post('/submit-xp', optionalWalletAuth, submitXP);
router.get('/leaderboard', getLeaderboard);
router.get('/stats', getGameStats);
router.get('/stats/:address?', optionalWalletAuth, getPlayerStats);
router.get('/history/:address?', optionalWalletAuth, getGameHistory);

export default router;
