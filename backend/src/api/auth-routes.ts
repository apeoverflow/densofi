import express from 'express';
import { optionalApiKey } from '../middleware/auth.js';
import { AuthController } from '../controllers/auth.controller.js';

// Export auth route handlers as named functions
/**
 * Get authentication status
 * @see AuthController.getStatus
 */
export const getStatus = AuthController.getStatus;

/**
 * Request signature message
 * @see AuthController.requestMessage
 */
export const requestMessage = AuthController.requestMessage;

/**
 * Verify wallet signature
 * @see AuthController.verifySignature
 */
export const verifySignature = AuthController.verifySignature;

/**
 * Get wallet information
 * @see AuthController.getWalletInfo
 */
export const getWalletInfo = AuthController.getWalletInfo;

/**
 * Get wallets by IP address
 * @see AuthController.getWalletsByIP
 */
export const getWalletsByIP = AuthController.getWalletsForIP;

/**
 * Get authentication statistics
 * @see AuthController.getStats
 */
export const getStats = AuthController.getAuthStats;

// Create router and mount routes
const router = express.Router();

router.get('/status', optionalApiKey, getStatus);
router.post('/request-message', requestMessage);
router.post('/verify-signature', verifySignature);
router.get('/wallet/:address', getWalletInfo);
router.get('/ip/:ip/wallets', getWalletsByIP);
router.get('/stats', getStats);

export default router;
