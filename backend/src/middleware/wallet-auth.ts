import { Request, Response, NextFunction } from 'express';
import { walletAuthService, WalletAuthData } from '../services/wallet-auth-service.js';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

export interface WalletAuthenticatedRequest extends Request {
  wallet?: WalletAuthData;
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
 * Admin API key can override wallet authentication requirement
 * Expects X-Wallet-Address header with authenticated wallet address OR valid admin API key
 */
export function requireWalletAuth(req: WalletAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // First, check for admin authentication
    if (checkAdminAuth(req)) {
      req.isAdminAuthenticated = true;
      logger.info('Admin authentication bypassing wallet auth', {
        path: req.path,
        ip: req.ip
      });
      return next();
    }

    const walletAddress = req.headers['x-wallet-address'] as string;
    
    // Debug logging
    logger.info('Wallet auth attempt', {
      walletAddress,
      headers: req.headers,
      path: req.path
    });
    
    if (!walletAddress) {
      return res.status(401).json({
        success: false,
        error: 'Wallet authentication or admin API key required',
        message: 'Please provide X-Wallet-Address header with your authenticated wallet address, or use admin API key in Authorization header'
      });
    }

    // Check if wallet is authenticated
    const walletInfo = walletAuthService.getWalletInfo(walletAddress);
    
    // Debug logging
    logger.info('Wallet lookup result', {
      walletAddress,
      found: !!walletInfo,
      info: walletInfo ? {
        lastSeen: walletInfo.lastSeen,
        signInCount: walletInfo.signInCount
      } : null
    });
    
    if (!walletInfo) {
      return res.status(401).json({
        success: false,
        error: 'Wallet not authenticated',
        message: 'Please authenticate your wallet first using the /api/auth/verify-signature endpoint, or use admin API key'
      });
    }

    // Check if authentication is recent (within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (walletInfo.lastSeen < twentyFourHoursAgo) {
      return res.status(401).json({
        success: false,
        error: 'Authentication expired',
        message: 'Please re-authenticate your wallet. Authentication is valid for 24 hours, or use admin API key.'
      });
    }

    // Add wallet info to request
    req.wallet = walletInfo;
    req.isWalletAuthenticated = true;

    logger.info('Wallet authentication successful for route access', {
      walletAddress: walletInfo.walletAddress,
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
 * Optional wallet authentication middleware
 * Adds wallet info if provided but doesn't require it
 */
export function optionalWalletAuth(req: WalletAuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Check for admin authentication first
    if (checkAdminAuth(req)) {
      req.isAdminAuthenticated = true;
      logger.info('Admin authentication detected in optional wallet auth', {
        path: req.path,
        ip: req.ip
      });
    }

    const walletAddress = req.headers['x-wallet-address'] as string;
    
    if (walletAddress) {
      const walletInfo = walletAuthService.getWalletInfo(walletAddress);
      
      if (walletInfo) {
        // Check if authentication is recent
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (walletInfo.lastSeen >= twentyFourHoursAgo) {
          req.wallet = walletInfo;
          req.isWalletAuthenticated = true;
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Optional wallet authentication middleware error:', error);
    next(); // Continue without authentication
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