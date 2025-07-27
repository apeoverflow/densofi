import express from 'express';
import { DebugController } from '../controllers/debug.controller.js';
import { requireApiKey } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get service connection status
 */
router.get('/status', DebugController.getStatus);

/**
 * Get detailed event listener status
 * Requires API key authentication
 */
router.get('/event-listeners/status', requireApiKey, DebugController.getEventListenersStatus);

/**
 * Trigger manual processing of pending events
 * Requires API key authentication
 */
router.post('/process-pending', requireApiKey, DebugController.processPending);

export default router;
