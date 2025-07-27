import express from 'express';
import { domainRoutes } from './api/domain-routes.js';
import gameRoutes from './api/game-routes.js';
import adminRoutes from './api/admin-routes.js';
import authRoutes from './api/auth-routes.js';
import { logger } from './utils/logger.js';
import { ENV } from './config/env.js';
import { ROUTE_DESCRIPTIONS } from './config/routes.js';

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
  app.use('/api/admin', adminRoutes);
  app.use('/api/auth', authRoutes);

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
  Object.entries(ROUTE_DESCRIPTIONS).forEach(([path, description]) => {
    const method = path.includes('/submit-xp') ? 'POST' : 'GET';
    logger.info(`  ${method}  ${path} - ${description}`);
  });
  logger.info('');
  logger.info(`🌐 API server running on port ${port}`);
  });

  return server;
} 