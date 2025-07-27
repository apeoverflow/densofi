import express from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { optionalApiKey } from '../middleware/auth.js';

const router = express.Router();

router.get('/status', optionalApiKey, AuthController.getStatus);
router.post('/request-message', AuthController.requestMessage);
router.post('/verify-signature', AuthController.verifySignature);
router.get('/wallet/:address', AuthController.getWalletInfo);
router.get('/ip/:ip/wallets', AuthController.getWalletsForIP);
router.get('/stats', AuthController.getAuthStats);

export default router;
