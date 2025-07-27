import express from 'express';
import { requireApiKey, AuthenticatedRequest } from '../middleware/auth.js';
import { AdminController } from '../controllers/admin.controller.js';

// Export admin route handlers as named functions
/**
 * Get wallet authentication statistics
 * @see AdminController.getWalletAuthStats
 */
export const getWalletAuthStats = AdminController.getWalletAuthStats;

/**
 * Get all wallets
 * @see AdminController.getWallets
 */
export const getWallets = AdminController.getWallets;

/**
 * Get specific wallet details
 * @see AdminController.getWallet
 */
export const getWallet = AdminController.getWallet;

// Create router and mount routes
const router = express.Router();

router.get('/wallet-auth-stats', requireApiKey, getWalletAuthStats);
router.get('/wallets', requireApiKey, getWallets);
router.get('/wallets/:address', requireApiKey, getWallet);

export default router;
