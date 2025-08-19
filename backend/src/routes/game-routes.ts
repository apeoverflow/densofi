import express from 'express';
import { GameController } from '../controllers/game-controller.js';

const router = express.Router();

// Submit game XP score
router.post('/game/submit-xp', GameController.submitXP);

// Get player XP leaderboard (public endpoint)
router.get('/game/leaderboard', GameController.getLeaderboard);

// Get overall game statistics (public endpoint)
router.get('/game/stats', GameController.getGameStats);

// Get player stats
router.get('/game/stats/:address?', GameController.getPlayerStats);

// Get player game history
router.get('/game/history/:address?', GameController.getPlayerGameHistory);

export { router as gameRoutes };