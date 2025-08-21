import express from 'express';
import { domainsRoutes } from './routes/domains-routes.js';
import { debugRoutes } from './routes/debug-routes.js';
import { authRoutes } from './routes/auth-routes.js';
import { gameRoutes } from './routes/game-routes.js';
import { eventControlRouter } from './routes/event-control.js';
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
  app.use('/api', domainsRoutes);
  app.use('/api', debugRoutes);
  app.use('/api', authRoutes);
  app.use('/api', gameRoutes);
  app.use('/api/event-control', eventControlRouter);

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
    logger.info(`🌐 API server running on port ${port}`);
  });

  return server;
} 