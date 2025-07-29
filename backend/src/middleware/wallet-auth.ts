import { Request, Response, NextFunction } from 'express';
import { walletAuthService, WalletAuthData } from '../services/wallet-auth-service.js';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

export interface WalletAuthenticatedRequest extends Request {
  wallet?: WalletAuthData;
  walletAddress?: string;
  isWalletAuthenticated?: boolean;
  isAdminAuthenticated?: boolean;
}

/**
 * Helper function to check if request has valid admin API key
 */
function checkAdminAuth(req: WalletAuthenticatedRequest): boolean {
  if (!ENV.ADMIN_API_KEY) {
    return false;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return false;
  }

  let apiKey: string;
  if (authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7);
  } else if (authHeader.startsWith('ApiKey ')) {
    apiKey = authHeader.substring(7);
  } else {
    apiKey = authHeader;
  }

  return apiKey === ENV.ADMIN_API_KEY;
}

/**
 * Middleware to require wallet authentication
 * Uses JWT token validation for secure authentication
 * Admin API key from environment can also be used for authentication
 */
export function requireWalletAuth(req: WalletAuthenticatedRequest, res: Response, next: NextFunction) {
  req.isAdminAuthenticated = false;
  req.isWalletAuthenticated = false;
  req.wallet = undefined;
  req.walletAddress = undefined;
  try {
    // Check for admin authentication first
    if (checkAdminAuth(req)) {
      req.isAdminAuthenticated = true;
      logger.info('Admin authentication successful', {
        path: req.path,
        ip: req.ip
      });
      return next();
    }

    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please provide a valid JWT token in Authorization header (Bearer <token>) or admin API key'
      });
    }

    const token = authHeader.substring(7);
    const jwtResult = walletAuthService.verifyJWT(token);
    
    if (!jwtResult.isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Please re-authenticate your wallet to get a new JWT token'
      });
    }

    // Get wallet info to ensure wallet is still valid
    const walletInfo = walletAuthService.getWalletInfo(jwtResult.walletAddress);
    
    if (!walletInfo) {
      return res.status(401).json({
        success: false,
        error: 'Wallet authentication not found',
        message: 'Please re-authenticate your wallet'
      });
    }

    // Set request properties for route usage
    req.wallet = walletInfo;
    req.walletAddress = jwtResult.walletAddress;
    req.isWalletAuthenticated = true;

    logger.info('JWT wallet authentication successful', {
      walletAddress: jwtResult.walletAddress,
      path: req.path,
      ip: req.ip
    });

    next();
  } catch (error) {
    logger.error('Wallet authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

/**
 * Enhanced wallet authentication middleware with JWT support
 * Checks for JWT token in Authorization header or falls back to admin key
 * Sets req.walletAddress from validated JWT token for route usage
 */
export function requireAdminKeyOrWalletAuth(req: WalletAuthenticatedRequest, res: Response, next: NextFunction) {
  // Reset authentication state
  req.isAdminAuthenticated = false;
  req.isWalletAuthenticated = false;
  req.wallet = undefined;
  req.walletAddress = undefined;
  
  try {
    // Check for admin authentication first
    if (checkAdminAuth(req)) {
      req.isAdminAuthenticated = true;
      logger.info('Admin authentication detected', {
        path: req.path,
        ip: req.ip
      });
      return next();
    }

    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    logger.info('Middleware Debug - requireAdminKeyOrWalletAuth', {
      hasAuthHeader: !!authHeader,
      authHeaderType: authHeader ? (authHeader.startsWith('Bearer ') ? 'Bearer' : 'Other') : 'None',
      path: req.path
    });
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const jwtResult = walletAuthService.verifyJWT(token);
      
      logger.info('JWT result in middleware', {
        isValid: jwtResult.isValid,
        walletAddress: jwtResult.walletAddress,
        path: req.path
      });
      
      if (jwtResult.isValid) {
        // Valid JWT token found - get wallet info
        const walletInfo = walletAuthService.getWalletInfo(jwtResult.walletAddress);
        
        if (walletInfo) {
          req.wallet = walletInfo;
          req.walletAddress = jwtResult.walletAddress;
          req.isWalletAuthenticated = true;
          
          logger.info('JWT wallet authentication successful', {
            walletAddress: jwtResult.walletAddress,
            path: req.path,
            ip: req.ip
          });
        } else {
          logger.warn('JWT valid but wallet info not found', {
            walletAddress: jwtResult.walletAddress,
            path: req.path,
            ip: req.ip
          });
        }
      } else if (jwtResult.walletAddress) {
        logger.warn('Invalid or expired JWT token', {
          walletAddress: jwtResult.walletAddress,
          path: req.path,
          ip: req.ip
        });
      } else {
        logger.warn('JWT verification failed completely', {
          path: req.path,
          ip: req.ip
        });
      }
    } else {
      logger.info('No valid Bearer token found', {
        path: req.path,
        ip: req.ip
      });
    }

    next();
  } catch (error) {
    logger.error('Wallet authentication middleware error:', error);
    next();
  }
}

/**
 * Middleware to check for suspicious wallet activity
 * Can be used in combination with other auth middleware
 */
export function checkSuspiciousWallet(req: WalletAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.wallet && req.wallet.suspiciousActivity && req.wallet.suspiciousActivity.length > 0) {
      logger.warn('Suspicious wallet accessing protected route', {
        walletAddress: req.wallet.walletAddress,
        suspiciousActivity: req.wallet.suspiciousActivity,
        path: req.path,
        ip: req.ip
      });

      // For now, just log but allow access
      // In production, you might want to rate limit or block suspicious wallets
    }

    next();
  } catch (error) {
    logger.error('Suspicious wallet check middleware error:', error);
    next(); // Continue in case of error
  }
} 