import express from 'express';
import { DomainService } from '../services/domain-service.js';
import { ConnectionManager } from '../services/connection-manager.js';
import { domainEventListener } from '../services/domain-event-listener.js';
import { nftMinterEventListener } from '../services/nft-minter-event-listener.js';
import { NFTMinterService } from '../services/nft-minter-service.js';
import { logger } from '../utils/logger.js';
import { optionalApiKey, requireApiKey, AuthenticatedRequest } from '../middleware/auth.js';
import { requireWalletAuth, optionalWalletAuth, WalletAuthenticatedRequest } from '../middleware/wallet-auth.js';
import { ENV } from '../config/env.js';
import { walletAuthService } from '../services/wallet-auth-service.js';

const router = express.Router();

// Active domain routes
/**
 * Get all domains
 */
router.get('/domains', async (req, res) => {
  try {
    const domains = await DomainService.getAllDomains();
    res.json({
      success: true,
      data: domains,
      count: domains.length
    });
  } catch (error) {
    logger.error('Error fetching domains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch domains'
    });
  }
});

/**
 * Get domain by name
 */
router.get('/domains/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const domain = await DomainService.getDomainByName(name);
    
    if (!domain) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found'
      });
    }

    res.json({
      success: true,
      data: domain
    });
  } catch (error) {
    logger.error('Error fetching domain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch domain'
    });
  }
});

/**
 * Check if domain is registered
 */
router.get('/domains/:name/status', async (req, res) => {
  try {
    const { name } = req.params;
    const isRegistered = await DomainService.isDomainRegistered(name);
    
    res.json({
      success: true,
      data: {
        domainName: name,
        isRegistered
      }
    });
  } catch (error) {
    logger.error('Error checking domain status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check domain status'
    });
  }
});

/**
 * Get NFTs owned by an address
 */
router.get('/nfts/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Validate address format
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    const nfts = await NFTMinterService.getNFTsForOwner(address as `0x${string}`);
    
    res.json({
      success: true,
      data: {
        address,
        nfts,
        count: nfts.length
      }
    });
  } catch (error) {
    logger.error('Error fetching NFTs for address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch NFTs'
    });
  }
});

/**
 * Verify domain ownership via DNS
 * Requires wallet authentication - wallet must match the one in the URL
 */ 
router.get('/domains/:name/:walletAddress/verify', requireWalletAuth, async (req: WalletAuthenticatedRequest, res) => {
  try {
    const { name, walletAddress } = req.params;
    
    // If admin authenticated, allow access to any wallet verification
    if (!req.isAdminAuthenticated) {
      // For wallet auth, ensure the authenticated wallet matches the requested wallet
      if (!req.wallet || req.wallet.walletAddress !== walletAddress.toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: 'Wallet address mismatch',
          message: 'You can only verify domains for your authenticated wallet (or use admin API key)'
        });
      }
    }

    const isVerified = await DomainService.verifyDomainViaDns(name, walletAddress);
    res.status(200).json({
      success: true,
      data: {
        domainName: name,
        walletAddress,
        isVerified,
        authenticatedWallet: req.wallet?.walletAddress || null,
        authType: req.isAdminAuthenticated ? 'admin' : 'wallet',
        adminOverride: !!req.isAdminAuthenticated
      }
    });
  } catch (error) {
    logger.error('Error verifying domain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify domain'
    });
  }
});

// Commented out routes (moved to debug-routes.ts)
// /**
//  * Get service connection status
//  */
// router.get('/status', (req, res) => {
//   try {
//     const status = ConnectionManager.getStatus();
//     res.json({
//       success: true,
//       data: status
//     });
//   } catch (error) {
//     logger.error('Error getting service status:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to get service status'
//     });
//   }
// });
// 
// /**
//  * Trigger manual processing of pending events
//  * Requires API key authentication
//  */
// router.post('/debug/process-pending', requireApiKey, async (req: AuthenticatedRequest, res) => {
//   try {
//     await DomainService.processPendingRegistrations();
//     await DomainService.processPendingOwnershipUpdates();
//     
//     const responseMessage = ENV.ENABLE_EVENT_LISTENERS 
//       ? 'Pending events processed successfully'
//       : 'Pending events processed successfully (Note: Event listeners are disabled - events must be processed manually)';
//     
//     res.json({
//       success: true,
//       message: responseMessage,
//       eventListenersEnabled: ENV.ENABLE_EVENT_LISTENERS
//     });
//   } catch (error) {
//     logger.error('Error processing pending events:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to process pending events'
//     });
//   }
// });
// 
// /**
//  * Get detailed event listener status
//  * Requires API key authentication
//  */
// router.get('/debug/event-listeners/status', requireApiKey, async (req: AuthenticatedRequest, res) => {
//   try {
//     const status = {
//       domainEventListener: {
//         isListening: domainEventListener.getStatus(),
//         lastActivity: 'unknown' // Could be enhanced to track last event time
//       },
//       nftMinterEventListener: {
//         isListening: nftMinterEventListener.getStatus(),
//         lastActivity: 'unknown' // Could be enhanced to track last event time
//       }
//     };
//     
//     res.json({
//       success: true,
//       data: status
//     });
//   } catch (error) {
//     logger.error('Error getting event listener status:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to get event listener status'
//     });
//   }
// });
// 
// Debug routes have been moved to debug-routes.ts
// These routes are commented out but kept for reference
// /**
//  * Get service connection status
//  */
// router.get('/status', (req, res) => {
//   try {
//     const status = ConnectionManager.getStatus();
//     res.json({
//       success: true,
//       data: status
//     });
//   } catch (error) {
//     logger.error('Error getting service status:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to get service status'
//     });
//   }
// });
// 
// /**
//  * Trigger manual processing of pending events
//  * Requires API key authentication
//  */
// router.post('/debug/process-pending', requireApiKey, async (req: AuthenticatedRequest, res) => {
//   try {
//     await DomainService.processPendingRegistrations();
//     await DomainService.processPendingOwnershipUpdates();
//     
//     const responseMessage = ENV.ENABLE_EVENT_LISTENERS 
//       ? 'Pending events processed successfully'
//       : 'Pending events processed successfully (Note: Event listeners are disabled - events must be processed manually)';
//     
//     res.json({
//       success: true,
//       message: responseMessage,
//       eventListenersEnabled: ENV.ENABLE_EVENT_LISTENERS
//     });
//   } catch (error) {
//     logger.error('Error processing pending events:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to process pending events'
//     });
//   }
// });
// 
// /**
//  * Debug endpoint to check wallet authentication status
//  * Requires wallet address in X-Wallet-Address header
//  */
// router.get('/debug/wallet-auth', (req, res) => {
//   try {
//     const walletAddress = req.headers['x-wallet-address'] as string;
//     const authHeader = req.headers.authorization;
//     
//     const debugInfo = {
//       providedWalletAddress: walletAddress,
//       normalizedWalletAddress: walletAddress ? walletAddress.toLowerCase() : null,
//       authorizationHeader: authHeader ? authHeader.substring(0, 20) + '...' : null,
//       ipAddress: req.ip || req.connection.remoteAddress || 'unknown'
//     };
// 
//     if (!walletAddress) {
//       return res.json({
//         success: false,
//         debug: debugInfo,
//         error: 'No X-Wallet-Address header provided'
//       });
//     }
// 
//     const walletInfo = walletAuthService.getWalletInfo(walletAddress);
//     
//     if (!walletInfo) {
//       // Let's also check all stored wallets for debugging
//       const allStats = walletAuthService.getAdminStats();
//       return res.json({
//         success: false,
//         debug: {
//           ...debugInfo,
//           walletNotFound: true,
//           totalStoredWallets: allStats.totalWallets,
//           storedWalletsPreview: allStats.topWallets.slice(0, 3).map(w => ({
//             address: w.walletAddress,
//             lastSeen: w.lastSeen
//           }))
//         },
//         error: 'Wallet not found in authenticated registry'
//       });
//     }
// 
//     // Check authentication freshness
//     const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
//     const isAuthValid = walletInfo.lastSeen >= twentyFourHoursAgo;
// 
//     return res.json({
//       success: true,
//       debug: debugInfo,
//       walletInfo: {
//         walletAddress: walletInfo.walletAddress,
//         lastSeen: walletInfo.lastSeen,
//         firstSeen: walletInfo.firstSeen,
//         signInCount: walletInfo.signInCount,
//         ipCount: walletInfo.ipAddresses.size,
//         isAuthValid,
//         timeSinceLastSeen: Date.now() - walletInfo.lastSeen.getTime()
//       }
//     });
//   } catch (error) {
//     logger.error('Debug wallet auth error:', error);
//     res.status(500).json({

// Auth routes have been moved to auth-routes.ts
//  */
// router.get('/auth/status', optionalApiKey, (req: WalletAuthenticatedRequest, res) => {
//   try {
//     res.json({
//       success: true,
//       data: {
//         isAuthenticated: !!req.isAdminAuthenticated,
//         walletAddress: req.wallet?.walletAddress || null,
//         isAdminAuthenticated: !!req.isAdminAuthenticated
//       }
//     });
//   } catch (error) {
//     logger.error('Error checking auth status:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to check authentication status'
//     });
//   }
// });
// 
// /**
//  * Request message to sign for wallet authentication
//  */
// router.post('/auth/request-message', (req, res) => {
//   try {
//     const authData = walletAuthService.generateAuthMessage();
//     
//     res.json({
//       success: true,
//       data: authData
//     });
//   } catch (error) {
//     logger.error('Error generating auth message:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to generate authentication message'
//     });
//   }
// });
// 
// /**
//  * Verify wallet signature and authenticate user
//  */
// router.post('/auth/verify-signature', async (req, res) => {
//   try {
//     const { nonce, signature, walletAddress } = req.body;
//     
//     if (!nonce || !signature || !walletAddress) {
//       return res.status(400).json({
//         success: false,
//         error: 'Missing required fields: nonce, signature, walletAddress'
//       });
//     }
// 
//     const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
//     const userAgent = req.get('User-Agent');
// 
//     const authResult = await walletAuthService.verifySignature(
//       { nonce, signature, walletAddress },
//       ipAddress,
//       userAgent
//     );
// 
//     res.json({
//       success: true,
//       message: 'Wallet authenticated successfully',
//       data: authResult
//     });
//   } catch (error) {
//     logger.error('Error verifying wallet signature:', error);
//     res.status(400).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to verify signature'
//     });
//   }
// });
// 
// /**
//  * Get wallet authentication information
//  */
// router.get('/auth/wallet/:address', (req, res) => {
//   try {
//     const { address } = req.params;
//     const walletInfo = walletAuthService.getWalletInfo(address);
//     
//     if (!walletInfo) {
//       return res.status(404).json({
//         success: false,
//         error: 'Wallet not found or never authenticated'
//       });
//     }
// 
//     // Convert Set to Array for JSON response
//     const responseData = {
//       ...walletInfo,
//       ipAddresses: Array.from(walletInfo.ipAddresses)
//     };
// 
//     res.json({
//       success: true,
//       data: responseData
//     });
//   } catch (error) {
//     logger.error('Error fetching wallet info:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch wallet information'
//     });
//   }
// });
// 
// /**
//  * Get wallets associated with an IP address
//  */
// router.get('/auth/ip/:ip/wallets', (req, res) => {
//   try {
//     const { ip } = req.params;
//     const wallets = walletAuthService.getWalletsForIP(ip);
//     
//     res.json({
//       success: true,
//       data: {
//         ipAddress: ip,
//         wallets,
//         count: wallets.length
//       }
//     });
//   } catch (error) {
//     logger.error('Error fetching IP wallet associations:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch IP wallet associations'
//     });
//   }
// });
// 
// /**
//  * Get authentication statistics
//  */
// router.get('/auth/stats', (req, res) => {
//   try {
//     const stats = walletAuthService.getAuthStats();
//     
//     res.json({
//       success: true,
//       data: {
//         ...stats,
//         currentIP: req.ip || req.connection.remoteAddress || 'unknown'
//       }
//     });
//   } catch (error) {
//     logger.error('Error fetching auth stats:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch authentication statistics'
//     });
//   }
// });

// Admin routes have been moved to admin-routes.ts
// /**
//  * Get all verified wallets with pagination (Admin only)
//  * Requires API key authentication
//  */
// router.get('/admin/wallets', requireApiKey, (req: AuthenticatedRequest, res) => {
//   try {
//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 50;
//     const sortBy = req.query.sortBy as string || 'lastSeen';
//     const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';

//     const result = walletAuthService.getPaginatedWallets(page, limit, sortBy, order);
//     
//     res.json({
//       success: true,
//       data: result
//     });
//   } catch (error) {
//     logger.error('Error fetching paginated wallets:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch wallet list'
//     });
//   }
// });
// 
// /**
//  * Get detailed wallet information (Admin only)
//  * Requires API key authentication
//  */
// router.get('/admin/wallets/:address', requireApiKey, (req: AuthenticatedRequest, res) => {
//   try {
//     const { address } = req.params;
//     const walletInfo = walletAuthService.getWalletInfo(address);
//     
//     if (!walletInfo) {
//       return res.status(404).json({
//         success: false,
//         error: 'Wallet not found or never authenticated'
//       });
//     }

//     // Convert Set to Array and add additional admin info
//     const responseData = {
//       ...walletInfo,
//       ipAddresses: Array.from(walletInfo.ipAddresses),
//       ipCount: walletInfo.ipAddresses.size,
//       isRecent: new Date(Date.now() - 24 * 60 * 60 * 1000) < walletInfo.lastSeen,
//       hasSuspiciousActivity: !!(walletInfo.suspiciousActivity && walletInfo.suspiciousActivity.length > 0)
//     };

//     res.json({
//       success: true,
//       data: responseData
//     });
//   } catch (error) {
//     logger.error('Error fetching admin wallet details:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch wallet details'
//     });
//   }
// });

/**
 * Submit game XP score
 * Requires wallet authentication
 */
// Game routes have been moved to game-routes.ts
// router.post('/game/submit-xp', optionalWalletAuth, async (req: WalletAuthenticatedRequest, res) => {
//   try {
//     const { score, gameType = 'dino-runner', difficulty = 'normal' } = req.body;
//     
//     if (!req.wallet) {
//       return res.status(401).json({
//         success: false,
//         error: 'Wallet authentication required'
//       });
//     }
//     
//     if (typeof score !== 'number' || score < 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid score: must be a non-negative number'
//       });
//     }
// 
//     const walletAddress = req.wallet.walletAddress;
//     const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
//     const userAgent = req.get('User-Agent');
// 
//     // Submit XP to database and update player stats
//     const { GameService } = await import('../services/game-service.js');
//     const result = await GameService.submitXP(
//       walletAddress,
//       score,
//       gameType,
//       difficulty,
//       ipAddress,
//       userAgent
//     );
// 
//     const response = {
//       success: true,
//       data: {
//         walletAddress,
//         score,
//         xpEarned: result.xpEarned,
//         totalXP: result.totalXP,
//         newHighScore: result.newHighScore,
//         gameType,
//         difficulty,
//         timestamp: new Date().toISOString(),
//         message: `Successfully earned ${result.xpEarned} XP! Total: ${result.totalXP}${result.newHighScore ? ' (New High Score!)' : ''}`
//       }
//     };
// 
//     res.json(response);
//     
//   } catch (error) {
//     logger.error('Error submitting game XP:', error);
//     res.status(500).json({
//       success: false,
//       error: error instanceof Error ? error.message : 'Failed to submit XP score'
//     });
//   }
// });

/**
 * Get player XP leaderboard
 * Public endpoint
 */
// Game routes have been moved to game-routes.ts
// router.get('/game/leaderboard', async (req, res) => {
//   try {
//     const limit = parseInt(req.query.limit as string) || 10;
//     
//     const { GameService } = await import('../services/game-service.js');
//     const leaderboard = await GameService.getLeaderboard(limit);
//     const totalPlayers = await GameService.getTotalPlayers();
// 
//     res.json({
//       success: true,
//       data: {
//         leaderboard,
//         totalPlayers,
//         lastUpdated: new Date().toISOString()
//       }
//     });
//     
//   } catch (error) {
//     logger.error('Error fetching leaderboard:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch leaderboard'
//     });
//   }
// });

// Game routes have been moved to game-routes.ts
// /**
//  * Get overall game statistics
//  * Public endpoint
//  */
// router.get('/game/stats', async (req, res) => {
//   try {
//     const { GameService } = await import('../services/game-service.js');
//     const stats = await GameService.getXPStats();
// 
//     res.json({
//       success: true,
//       data: stats
//     });
//     
//   } catch (error) {
//     logger.error('Error fetching game stats:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch game statistics'
//     });
//   }
// });

// Game routes have been moved to game-routes.ts
// /**
//  * Get player stats
//  * Requires wallet authentication or admin override
//  */
// router.get('/game/stats/:address?', optionalWalletAuth, async (req: WalletAuthenticatedRequest, res) => {
//   try {
//     const requestedAddress = req.params.address;
//     const authenticatedAddress = req.wallet?.walletAddress;
//     const isAdmin = req.isAdminAuthenticated;
// 
//     // Determine which address to get stats for
//     let targetAddress: string;
//     
//     if (requestedAddress) {
//       // If a specific address is requested, check permissions
//       if (!isAdmin && authenticatedAddress !== requestedAddress.toLowerCase()) {
//         return res.status(403).json({
//           success: false,
//           error: 'Can only view your own stats unless admin'
//         });
//       }
//       targetAddress = requestedAddress;
//     } else {
//       // No specific address requested, use authenticated wallet
//       if (!authenticatedAddress) {
//         return res.status(401).json({
//           success: false,
//           error: 'Wallet authentication required to view stats'
//         });
//       }
//       targetAddress = authenticatedAddress;
//     }
// 
//     // Get player stats from database
//     const { GameService } = await import('../services/game-service.js');
//     const stats = await GameService.getPlayerStats(targetAddress);
// 
//     if (!stats) {
//       return res.status(404).json({
//         success: false,
//         error: 'Player stats not found. Play a game first to generate stats!'
//       });
//     }
// 
//     // Calculate current rank (simplified - could be optimized with aggregation)
//     const leaderboard = await GameService.getLeaderboard(1000); // Get top 1000 to find rank
//     const currentRank = leaderboard.findIndex(entry => 
//       entry.walletAddress.toLowerCase() === targetAddress.toLowerCase()
//     ) + 1;
// 
//     const response = {
//       walletAddress: stats.walletAddress,
//       totalXP: stats.totalXP,
//       gamesPlayed: stats.gamesPlayed,
//       highScore: stats.highScore,
//       averageScore: stats.averageScore,
//       totalPlayTime: `${Math.floor(stats.totalPlayTime / 3600)}h ${Math.floor((stats.totalPlayTime % 3600) / 60)}m`,
//       achievementsUnlocked: stats.achievementsUnlocked,
//       currentRank: currentRank || 'Unranked',
//       lastPlayed: stats.lastPlayed,
//       createdAt: stats.createdAt
//     };
// 
//     res.json({
//       success: true,
//       data: response
//     });
//     
//   } catch (error) {
//     logger.error('Error fetching player stats:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch player stats'
//     });
//   }
// });

// Game routes have been moved to game-routes.ts
// /**
//  * Get player game history
//  * Requires wallet authentication or admin override
//  */
// router.get('/game/history/:address?', optionalWalletAuth, async (req: WalletAuthenticatedRequest, res) => {
//   try {
//     const requestedAddress = req.params.address;
//     const authenticatedAddress = req.wallet?.walletAddress;
//     const isAdmin = req.isAdminAuthenticated;
// 
//     // Determine which address to get history for
//     let targetAddress: string;
//     
//     if (requestedAddress) {
//       // If a specific address is requested, check permissions
//       if (!isAdmin && authenticatedAddress !== requestedAddress.toLowerCase()) {
//         return res.status(403).json({
//           success: false,
//           error: 'Can only view your own game history unless admin'
//         });
//       }
//       targetAddress = requestedAddress;
//     } else {
//       // No specific address requested, use authenticated wallet
//       if (!authenticatedAddress) {
//         return res.status(401).json({
//           success: false,
//           error: 'Wallet authentication required to view game history'
//         });
//       }
//       targetAddress = authenticatedAddress;
//     }
// 
//     const limit = parseInt(req.query.limit as string) || 20;
//     const offset = parseInt(req.query.offset as string) || 0;
// 
//     // Get player game history from database
//     const { GameService } = await import('../services/game-service.js');
//     const history = await GameService.getPlayerGameHistory(targetAddress, limit, offset);
// 
//     res.json({
//       success: true,
//       data: {
//         history,
//         pagination: {
//           limit,
//           offset,
//           hasMore: history.length === limit
//         }
//       }
//     });
//     
//   } catch (error) {
//     logger.error('Error fetching player game history:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch player game history'
//     });
//   }
// });

export { router as domainRoutes };