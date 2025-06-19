import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  isAuthenticated?: boolean;
}

/**
 * Middleware to validate API key authentication
 */
export function requireApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check if ADMIN_API_KEY is configured
    if (!ENV.ADMIN_API_KEY) {
      logger.error('ADMIN_API_KEY not configured in environment variables');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
    }

    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header is required'
      });
    }

    // Check for Bearer token format or direct API key
    let apiKey: string;
    
    if (authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (authHeader.startsWith('ApiKey ')) {
      apiKey = authHeader.substring(7); // Remove 'ApiKey ' prefix
    } else {
      // Assume the entire header is the API key
      apiKey = authHeader;
    }

    if (!apiKey || apiKey.trim() === '') {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format'
      });
    }

    // Validate API key
    if (apiKey !== ENV.ADMIN_API_KEY) {
      logger.warn('Invalid API key attempt', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    // Authentication successful
    req.isAuthenticated = true;
    logger.info('API key authentication successful', {
      ip: req.ip,
      path: req.path
    });
    
    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

/**
 * Optional middleware that adds authentication info but doesn't require it
 */
export function optionalApiKey(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && ENV.ADMIN_API_KEY) {
      let apiKey: string;
      
      if (authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7);
      } else if (authHeader.startsWith('ApiKey ')) {
        apiKey = authHeader.substring(7);
      } else {
        apiKey = authHeader;
      }

      if (apiKey === ENV.ADMIN_API_KEY) {
        req.isAuthenticated = true;
      }
    }
    
    next();
  } catch (error) {
    logger.error('Optional authentication middleware error:', error);
    next(); // Continue without authentication
  }
} 