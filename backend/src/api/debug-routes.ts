import express from 'express';
import { DebugController } from '../controllers/debug.controller.js';
import { requireApiKey } from '../middleware/auth.js';

const router = express.Router();

router.get('/status', DebugController.getStatus);
router.get('/event-listeners/status', requireApiKey, DebugController.getEventListenersStatus);
router.post('/process-pending', requireApiKey, DebugController.processPending);
router.get('/wallet-auth', requireApiKey, DebugController.getWalletAuthStatus);

export default router;
