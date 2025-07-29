import express from 'express';
import { DebugController } from '../controllers/debug-controller.js';
import { requireAdminKey } from '../middleware/auth.js';

const router = express.Router();

// All debug routes require admin authentication and are prefixed with /debug

// Get service connection status
router.get('/debug/status', requireAdminKey, DebugController.getStatus);

// Get wallets associated with an IP address (changed from /auth/ip/:ip/wallets to /debug/ip/:ip/wallets)
router.get('/debug/ip/:ip/wallets', requireAdminKey, DebugController.getWalletsForIP);

// Get authentication statistics
router.get('/debug/stats', requireAdminKey, DebugController.getAuthStats);

// Trigger manual processing of pending events
router.post('/debug/process-pending', requireAdminKey, DebugController.processPendingEvents);

// Get all verified wallets with pagination (changed from /admin/wallets to /debug/wallets)
router.get('/debug/wallets', requireAdminKey, DebugController.getAllWallets);

// Get detailed wallet information (changed from /admin/wallets/:address to /debug/wallets/:address)
router.get('/debug/wallets/:address', requireAdminKey, DebugController.getWalletDetails);

// Get detailed event listener status
router.get('/debug/event-listeners/status', requireAdminKey, DebugController.getEventListenerStatus);

// Get wallet authentication statistics (changed from /admin/wallet-auth-stats to /debug/wallet-auth-stats)
router.get('/debug/wallet-auth-stats', requireAdminKey, DebugController.getWalletAuthStats);

export { router as debugRoutes };