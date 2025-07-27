import express from 'express';
import { domainRoutes } from './api/domain-routes.js';
import gameRoutes from './api/game-routes.js';
import { logger } from './utils/logger.js';
import { ENV } from './config/env.js';

export function createServer() {
  const app = express();

  // Basic CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Wallet-Address');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging middleware
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    next();
  });

  // API routes
  app.use('/api', domainRoutes);
  app.use('/api/game', gameRoutes);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'DensoFi Domain Registration Service'
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found'
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });

  return app;
}

export function startServer() {
  const app = createServer();
  const port = ENV.PORT || 3000;

  const server = app.listen(port, () => {
    logger.info('');
  logger.info('Available endpoints:');
  logger.info('  GET  /health - Health check');
  logger.info('  GET  /api/status - Service connection status');
  logger.info('  GET  /api/domains - Get all registered domains');
  logger.info('  GET  /api/domains/:name - Get specific domain');
  logger.info('  GET  /api/domains/:name/status - Check domain registration status');
  logger.info('  GET  /api/nfts/:address - Get NFTs owned by address');
  logger.info('  POST /api/process-pending - Manually process pending events');
  logger.info('  GET  /api/domains/:name/:walletAddress/verify - Verify domain ownership via DNS');
  logger.info('  GET  /api/event-listeners/status - Get event listener status');
  logger.info('  POST /api/game/submit-xp - Submit game XP score');
  logger.info('  GET  /api/game/leaderboard - Get player XP leaderboard');
  logger.info('  GET  /api/game/stats - Get overall game statistics');
  logger.info('  GET  /api/game/stats/:address - Get player statistics');
  logger.info('  GET  /api/game/history/:address - Get player game history');
  logger.info('');
  logger.info(`🌐 API server running on port ${port}`);
  });

  return server;
} 