import express from 'express';
import { requireWalletAuth, optionalWalletAuth, WalletAuthenticatedRequest } from '../middleware/wallet-auth.js';
import { GameController } from '../controllers/game.controller.js';

// Export game route handlers from GameController
/**
 * Submit game XP score for a player
 * @see GameController.submitXP
 */
export const submitXP = GameController.submitXP;

/**
 * Get player XP leaderboard
 * @see GameController.getLeaderboard
 */
export const getLeaderboard = GameController.getLeaderboard;

/**
 * Get overall game statistics
 * @see GameController.getGameStats
 */
export const getGameStats = GameController.getGameStats;

/**
 * Get player statistics
 * @see GameController.getPlayerStats
 */
export const getPlayerStats = GameController.getPlayerStats;

/**
 * Get player game history
 * @see GameController.getGameHistory
 */
export const getGameHistory = GameController.getGameHistory;

// Create router and mount routes
const router = express.Router();

router.post('/submit-xp', optionalWalletAuth, submitXP);
router.get('/leaderboard', getLeaderboard);
router.get('/stats', getGameStats);
router.get('/stats/:address?', optionalWalletAuth, getPlayerStats);
router.get('/history/:address?', optionalWalletAuth, getGameHistory);

export default router;
