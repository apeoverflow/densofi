import express from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { requireApiKey } from '../middleware/auth.js';

const router = express.Router();

router.get('/wallet-auth-stats', requireApiKey, AdminController.getWalletAuthStats);
router.get('/wallets', requireApiKey, AdminController.getWallets);
router.get('/wallets/:address', requireApiKey, AdminController.getWallet);

export default router;
