import express from 'express';
import { GameController } from '../controllers/game.controller.js';
import { optionalWalletAuth } from '../middleware/wallet-auth.js';

const router = express.Router();

router.post('/submit-xp', optionalWalletAuth, GameController.submitXP);
router.get('/leaderboard', GameController.getLeaderboard);
router.get('/stats', GameController.getGameStats);
router.get('/stats/:address?', optionalWalletAuth, GameController.getPlayerStats);
router.get('/history/:address?', optionalWalletAuth, GameController.getGameHistory);

export default router;
