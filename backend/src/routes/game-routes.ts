import express from 'express';
import { GameController } from '../controllers/game-controller.js';
import { requireAdminKeyOrWalletAuth } from '../middleware/wallet-auth.js';

const router = express.Router();

// Submit game XP score
router.post('/game/submit-xp', requireAdminKeyOrWalletAuth, GameController.submitXP);

// Get player XP leaderboard (public endpoint)
router.get('/game/leaderboard', GameController.getLeaderboard);

// Get overall game statistics (public endpoint)
router.get('/game/stats', GameController.getGameStats);

// Get player stats (requires wallet authentication or admin override)
router.get('/game/stats/:address?', requireAdminKeyOrWalletAuth, GameController.getPlayerStats);

// Get player game history (requires wallet authentication or admin override)
router.get('/game/history/:address?', requireAdminKeyOrWalletAuth, GameController.getPlayerGameHistory);

export { router as gameRoutes };