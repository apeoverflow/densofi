import { Router, Request, Response } from 'express';
import { timedEventManager } from '../services/timed-event-manager.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * Start timed event listening
 * POST /api/event-control/start
 * Body: { reason?: string, duration?: number }
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { reason, duration } = req.body;
    
    // Update duration if provided (in seconds, convert to ms)
    if (duration && typeof duration === 'number' && duration > 0) {
      timedEventManager.updateConfig({ duration: duration * 1000 });
    }

    await timedEventManager.startTimedListening(reason || 'api_request');
    
    const status = timedEventManager.getStatus();
    
    res.json({
      success: true,
      message: 'Timed event listeners started successfully',
      status: {
        isActive: status.isActive,
        duration: status.config.duration / 1000, // Return in seconds
        remainingTime: Math.round(status.remainingTime / 1000), // Return in seconds
        startTime: status.startTime
      }
    });
  } catch (error) {
    logger.error('Error starting timed event listeners:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Stop timed event listening
 * POST /api/event-control/stop
 * Body: { reason?: string }
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;
    
    await timedEventManager.stopTimedListening(reason || 'api_request');
    
    res.json({
      success: true,
      message: 'Timed event listeners stopped successfully'
    });
  } catch (error) {
    logger.error('Error stopping timed event listeners:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Extend current listening duration
 * POST /api/event-control/extend
 */
router.post('/extend', (req: Request, res: Response) => {
  try {
    timedEventManager.extendDuration();
    
    const status = timedEventManager.getStatus();
    
    res.json({
      success: true,
      message: 'Event listener duration extended successfully',
      status: {
        isActive: status.isActive,
        remainingTime: Math.round(status.remainingTime / 1000) // Return in seconds
      }
    });
  } catch (error) {
    logger.error('Error extending event listener duration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get current status
 * GET /api/event-control/status
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = timedEventManager.getStatus();
    
    res.json({
      success: true,
      status: {
        isActive: status.isActive,
        startTime: status.startTime,
        duration: status.config.duration / 1000, // Return in seconds
        remainingTime: Math.round(status.remainingTime / 1000), // Return in seconds
        autoRestart: status.config.autoRestart,
        maxRestarts: status.config.maxRestarts,
        restartCount: status.restartCount
      }
    });
  } catch (error) {
    logger.error('Error getting event listener status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update configuration
 * POST /api/event-control/config
 * Body: { duration?: number, autoRestart?: boolean, maxRestarts?: number }
 */
router.post('/config', (req: Request, res: Response) => {
  try {
    const { duration, autoRestart, maxRestarts } = req.body;
    
    const config: any = {};
    if (typeof duration === 'number' && duration > 0) {
      config.duration = duration * 1000; // Convert seconds to ms
    }
    if (typeof autoRestart === 'boolean') {
      config.autoRestart = autoRestart;
    }
    if (typeof maxRestarts === 'number' && maxRestarts >= 0) {
      config.maxRestarts = maxRestarts;
    }
    
    timedEventManager.updateConfig(config);
    
    const status = timedEventManager.getStatus();
    
    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        duration: status.config.duration / 1000, // Return in seconds
        autoRestart: status.config.autoRestart,
        maxRestarts: status.config.maxRestarts
      }
    });
  } catch (error) {
    logger.error('Error updating event listener config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { router as eventControlRouter };