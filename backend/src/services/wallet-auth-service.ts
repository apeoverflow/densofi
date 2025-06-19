import { verifyMessage } from 'viem';
import { logger } from '../utils/logger.js';

export interface WalletAuthData {
  walletAddress: string;
  ipAddresses: Set<string>;
  firstSeen: Date;
  lastSeen: Date;
  signInCount: number;
  userAgent?: string;
  suspiciousActivity: string[] | null;
}

export interface AuthNonce {
  nonce: string;
  message: string;
  expiresAt: Date;
  used: boolean;
}

export interface SignatureVerificationRequest {
  nonce: string;
  signature: string;
  walletAddress: string;
}

export interface AuthResult {
  walletAddress: string;
  ipAddress: string;
  isNewWallet: boolean;
  signInCount: number;
  firstSeen: Date;
  lastSeen: Date;
  suspiciousActivity: string[] | null;
  isVerified: boolean;
  sessionId: string;
  expiresAt: string;
}

class WalletAuthService {
  private walletData = new Map<string, WalletAuthData>();
  private ipToWallets = new Map<string, Set<string>>();
  private nonces = new Map<string, AuthNonce>();
  
  // Configuration
  private readonly NONCE_EXPIRY_MINUTES = 10;
  private readonly MAX_IPS_PER_WALLET = 5;
  private readonly MAX_WALLETS_PER_IP = 10;
  private readonly RAPID_SIGNIN_THRESHOLD_SECONDS = 60;

  /**
   * Generate a message and nonce for wallet signing
   */
  generateAuthMessage(): { message: string; nonce: string; expiresAt: Date } {
    const nonce = this.generateNonce();
    const expiresAt = new Date(Date.now() + this.NONCE_EXPIRY_MINUTES * 60 * 1000);
    
    const message = `Welcome to DensoFi!

This request will not trigger a blockchain transaction or cost any gas fees.

Your authentication status will be securely verified.

Nonce: ${nonce}
Issued: ${new Date().toISOString()}
Valid until: ${expiresAt.toISOString()}`;

    this.nonces.set(nonce, {
      nonce,
      message,
      expiresAt,
      used: false
    });

    // Clean up expired nonces
    this.cleanupExpiredNonces();

    logger.info('Generated auth message', { nonce, expiresAt });
    
    return { message, nonce, expiresAt };
  }

  /**
   * Verify wallet signature and authenticate user
   */
  async verifySignature(
    request: SignatureVerificationRequest,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuthResult> {
    const { nonce, signature, walletAddress } = request;
    
    // Normalize wallet address
    const normalizedAddress = walletAddress.toLowerCase();
    
    // Validate nonce
    const nonceData = this.nonces.get(nonce);
    if (!nonceData) {
      throw new Error('Invalid or expired nonce');
    }

    if (nonceData.used) {
      throw new Error('Nonce already used');
    }

    if (new Date() > nonceData.expiresAt) {
      this.nonces.delete(nonce);
      throw new Error('Nonce expired');
    }

    // Verify signature
    try {
      const isValid = await verifyMessage({
        address: walletAddress as `0x${string}`,
        message: nonceData.message,
        signature: signature as `0x${string}`
      });

      if (!isValid) {
        throw new Error('Invalid signature');
      }
    } catch (error) {
      logger.warn('Signature verification failed', { 
        walletAddress: normalizedAddress, 
        ipAddress,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error('Invalid signature or expired nonce');
    }

    // Mark nonce as used
    nonceData.used = true;

    // Get or create wallet data
    const isNewWallet = !this.walletData.has(normalizedAddress);
    let walletData = this.walletData.get(normalizedAddress);

    if (!walletData) {
      walletData = {
        walletAddress: normalizedAddress,
        ipAddresses: new Set([ipAddress]),
        firstSeen: new Date(),
        lastSeen: new Date(),
        signInCount: 1,
        userAgent,
        suspiciousActivity: null
      };
    } else {
      // Check for rapid sign-ins
      const timeSinceLastSeen = Date.now() - walletData.lastSeen.getTime();
      if (timeSinceLastSeen < this.RAPID_SIGNIN_THRESHOLD_SECONDS * 1000) {
        this.flagSuspiciousActivity(normalizedAddress, 'Rapid sign-ins detected');
      }

      walletData.ipAddresses.add(ipAddress);
      walletData.lastSeen = new Date();
      walletData.signInCount++;
      if (userAgent) {
        walletData.userAgent = userAgent;
      }
    }

    // Update IP to wallet mapping
    if (!this.ipToWallets.has(ipAddress)) {
      this.ipToWallets.set(ipAddress, new Set());
    }
    this.ipToWallets.get(ipAddress)!.add(normalizedAddress);

    // Check for suspicious activity
    this.checkSuspiciousActivity(normalizedAddress, ipAddress);

    // Store updated wallet data
    this.walletData.set(normalizedAddress, walletData);

    logger.info('Wallet authentication successful', {
      walletAddress: normalizedAddress,
      ipAddress,
      isNewWallet,
      signInCount: walletData.signInCount
    });

    // Generate session ID and expiration
    const sessionId = this.generateSessionId();
    const sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      walletAddress: normalizedAddress,
      ipAddress,
      isNewWallet,
      signInCount: walletData.signInCount,
      firstSeen: walletData.firstSeen,
      lastSeen: walletData.lastSeen,
      suspiciousActivity: walletData.suspiciousActivity,
      // Required for frontend authentication
      isVerified: true,
      sessionId: sessionId,
      expiresAt: sessionExpiresAt.toISOString()
    };
  }

  /**
   * Get wallet information
   */
  getWalletInfo(walletAddress: string): WalletAuthData | null {
    return this.walletData.get(walletAddress.toLowerCase()) || null;
  }

  /**
   * Get wallets associated with an IP address
   */
  getWalletsForIP(ipAddress: string): string[] {
    const wallets = this.ipToWallets.get(ipAddress);
    return wallets ? Array.from(wallets) : [];
  }

  /**
   * Get authentication statistics
   */
  getAuthStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const wallets = Array.from(this.walletData.values());
    
    const activeWallets24h = wallets.filter(w => w.lastSeen >= last24h).length;
    const activeWallets7d = wallets.filter(w => w.lastSeen >= last7d).length;
    const newWallets24h = wallets.filter(w => w.firstSeen >= last24h).length;
    const suspiciousWallets = wallets.filter(w => w.suspiciousActivity && w.suspiciousActivity.length > 0).length;

    return {
      totalWallets: wallets.length,
      activeWallets24h,
      activeWallets7d,
      newWallets24h,
      suspiciousWallets,
      totalSignIns: wallets.reduce((sum, w) => sum + w.signInCount, 0),
      uniqueIPs: this.ipToWallets.size
    };
  }

  /**
   * Get detailed admin statistics
   */
  getAdminStats() {
    const basicStats = this.getAuthStats();
    const wallets = Array.from(this.walletData.values());
    
    // Top active wallets
    const topWallets = wallets
      .sort((a, b) => b.signInCount - a.signInCount)
      .slice(0, 10)
      .map(w => ({
        walletAddress: w.walletAddress,
        signInCount: w.signInCount,
        lastSeen: w.lastSeen,
        ipCount: w.ipAddresses.size
      }));

    // Suspicious activity analysis
    const suspiciousWallets = wallets
      .filter(w => w.suspiciousActivity && w.suspiciousActivity.length > 0)
      .map(w => ({
        walletAddress: w.walletAddress,
        suspiciousActivity: w.suspiciousActivity,
        signInCount: w.signInCount,
        ipCount: w.ipAddresses.size,
        lastSeen: w.lastSeen
      }));

    return {
      ...basicStats,
      topWallets,
      suspiciousWallets
    };
  }

  /**
   * Get paginated wallet list (admin)
   */
  getPaginatedWallets(page = 1, limit = 50, sortBy = 'lastSeen', order: 'asc' | 'desc' = 'desc') {
    const wallets = Array.from(this.walletData.values());
    
    // Sort wallets
    wallets.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'lastSeen':
          comparison = a.lastSeen.getTime() - b.lastSeen.getTime();
          break;
        case 'firstSeen':
          comparison = a.firstSeen.getTime() - b.firstSeen.getTime();
          break;
        case 'signInCount':
          comparison = a.signInCount - b.signInCount;
          break;
        case 'walletAddress':
          comparison = a.walletAddress.localeCompare(b.walletAddress);
          break;
        default:
          comparison = a.lastSeen.getTime() - b.lastSeen.getTime();
      }
      
      return order === 'desc' ? -comparison : comparison;
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedWallets = wallets.slice(startIndex, endIndex);

    return {
      wallets: paginatedWallets.map(w => ({
        walletAddress: w.walletAddress,
        firstSeen: w.firstSeen,
        lastSeen: w.lastSeen,
        signInCount: w.signInCount,
        ipCount: w.ipAddresses.size,
        suspiciousActivity: w.suspiciousActivity,
        userAgent: w.userAgent
      })),
      pagination: {
        page,
        limit,
        total: wallets.length,
        totalPages: Math.ceil(wallets.length / limit),
        hasNext: endIndex < wallets.length,
        hasPrev: page > 1
      }
    };
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }

  private generateSessionId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private cleanupExpiredNonces(): void {
    const now = new Date();
    for (const [nonce, data] of this.nonces.entries()) {
      if (now > data.expiresAt) {
        this.nonces.delete(nonce);
      }
    }
  }

  private checkSuspiciousActivity(walletAddress: string, ipAddress: string): void {
    const walletData = this.walletData.get(walletAddress);
    if (!walletData) return;

    const suspiciousReasons: string[] = [];

    // Check if wallet used from too many IPs
    if (walletData.ipAddresses.size > this.MAX_IPS_PER_WALLET) {
      suspiciousReasons.push(`Wallet used from ${walletData.ipAddresses.size} different IP addresses`);
    }

    // Check if IP has too many wallets
    const walletsForIP = this.ipToWallets.get(ipAddress);
    if (walletsForIP && walletsForIP.size > this.MAX_WALLETS_PER_IP) {
      suspiciousReasons.push(`IP address associated with ${walletsForIP.size} different wallets`);
    }

    if (suspiciousReasons.length > 0) {
      this.flagSuspiciousActivity(walletAddress, ...suspiciousReasons);
    }
  }

  private flagSuspiciousActivity(walletAddress: string, ...reasons: string[]): void {
    const walletData = this.walletData.get(walletAddress);
    if (!walletData) return;

    if (!walletData.suspiciousActivity) {
      walletData.suspiciousActivity = [];
    }

    // Add new reasons that aren't already present
    for (const reason of reasons) {
      if (!walletData.suspiciousActivity.includes(reason)) {
        walletData.suspiciousActivity.push(reason);
      }
    }

    logger.warn('Suspicious wallet authentication activity', {
      walletAddress,
      reasons: walletData.suspiciousActivity
    });
  }
}

export const walletAuthService = new WalletAuthService(); 