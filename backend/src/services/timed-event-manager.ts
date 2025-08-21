import { logger } from '../utils/logger.js';
import { domainEventListener } from './domain-event-listener.js';
import { nftMinterEventListener } from './nft-minter-event-listener.js';
import { tokenMinterEventListener } from './token-minter-event-listener.js';

export interface TimedEventConfig {
  duration: number; // Duration in milliseconds
  autoRestart: boolean; // Whether to restart automatically
  maxRestarts: number; // Maximum number of auto-restarts
}

/**
 * Service for managing time-limited event listeners
 * Automatically starts and stops event listeners after a specified duration
 */
export class TimedEventManager {
  private static instance: TimedEventManager | null = null;
  private timeoutId: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private startTime: number | null = null;
  private restartCount: number = 0;
  private config: TimedEventConfig;

  // Default configuration: 5 minutes timeout, no auto-restart
  private defaultConfig: TimedEventConfig = {
    duration: 5 * 60 * 1000, // 5 minutes
    autoRestart: false,
    maxRestarts: 0
  };

  private constructor(config?: Partial<TimedEventConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<TimedEventConfig>): TimedEventManager {
    if (!TimedEventManager.instance) {
      TimedEventManager.instance = new TimedEventManager(config);
    }
    return TimedEventManager.instance;
  }

  /**
   * Start timed event listening
   * @param reason Optional reason for starting (for logging)
   */
  async startTimedListening(reason?: string): Promise<void> {
    if (this.isActive) {
      logger.warn('Timed event listening already active, extending duration');
      this.extendDuration();
      return;
    }

    try {
      const reasonMsg = reason ? ` (Reason: ${reason})` : '';
      logger.info(`🕐 Starting timed event listeners for ${this.config.duration / 1000}s${reasonMsg}`);
      
      this.startTime = Date.now();
      this.isActive = true;

      // Start all event listeners
      await domainEventListener.startListening();
      logger.info('✅ Domain event listener started');
      
      await nftMinterEventListener.startListening();
      logger.info('✅ NFT minter event listener started');
      
      await tokenMinterEventListener.startListening();
      logger.info('✅ Token minter event listener started');

      // Set timeout to stop listeners
      this.timeoutId = setTimeout(() => {
        this.stopTimedListening('timeout_reached').catch((error) => {
          logger.error('Error stopping timed listeners on timeout:', error);
        });
      }, this.config.duration);

      logger.info(`⏰ Event listeners will stop automatically in ${this.config.duration / 1000} seconds`);
      
    } catch (error) {
      this.isActive = false;
      this.startTime = null;
      logger.error('Failed to start timed event listeners:', error);
      throw error;
    }
  }

  /**
   * Stop timed event listening
   * @param reason Reason for stopping (for logging)
   */
  async stopTimedListening(reason: string = 'manual_stop'): Promise<void> {
    if (!this.isActive) {
      logger.warn('Timed event listening not active');
      return;
    }

    try {
      logger.info(`🛑 Stopping timed event listeners (Reason: ${reason})`);

      // Clear timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }

      // Stop all event listeners
      domainEventListener.stopListening();
      nftMinterEventListener.stopListening();
      tokenMinterEventListener.stopListening();

      // Calculate how long listeners were active
      const activeTime = this.startTime ? Date.now() - this.startTime : 0;
      logger.info(`📊 Event listeners were active for ${Math.round(activeTime / 1000)}s`);

      this.isActive = false;
      this.startTime = null;

      // Handle auto-restart if configured
      if (this.config.autoRestart && reason === 'timeout_reached' && this.restartCount < this.config.maxRestarts) {
        this.restartCount++;
        logger.info(`🔄 Auto-restarting event listeners (${this.restartCount}/${this.config.maxRestarts})`);
        await this.startTimedListening('auto_restart');
      } else {
        this.restartCount = 0; // Reset restart count
        logger.info('✅ Timed event listeners stopped successfully');
      }

    } catch (error) {
      logger.error('Error stopping timed event listeners:', error);
      throw error;
    }
  }

  /**
   * Extend the current listening duration by the configured amount
   */
  extendDuration(): void {
    if (!this.isActive || !this.timeoutId) {
      logger.warn('Cannot extend duration - timed listening not active');
      return;
    }

    // Clear existing timeout
    clearTimeout(this.timeoutId);

    // Set new timeout
    this.timeoutId = setTimeout(() => {
      this.stopTimedListening('timeout_reached').catch((error) => {
        logger.error('Error stopping timed listeners on timeout:', error);
      });
    }, this.config.duration);

    logger.info(`⏰ Event listener duration extended by ${this.config.duration / 1000} seconds`);
  }

  /**
   * Get remaining time in milliseconds
   */
  getRemainingTime(): number {
    if (!this.isActive || !this.startTime) {
      return 0;
    }
    
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.config.duration - elapsed);
    return remaining;
  }

  /**
   * Get status information
   */
  getStatus(): {
    isActive: boolean;
    startTime: number | null;
    remainingTime: number;
    config: TimedEventConfig;
    restartCount: number;
  } {
    return {
      isActive: this.isActive,
      startTime: this.startTime,
      remainingTime: this.getRemainingTime(),
      config: this.config,
      restartCount: this.restartCount
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<TimedEventConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Timed event manager configuration updated:', this.config);
  }

  /**
   * Force stop and reset
   */
  async forceReset(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.isActive = false;
    this.startTime = null;
    this.restartCount = 0;

    // Ensure all listeners are stopped
    try {
      domainEventListener.stopListening();
      nftMinterEventListener.stopListening();
      tokenMinterEventListener.stopListening();
      logger.info('🔄 Timed event manager reset successfully');
    } catch (error) {
      logger.error('Error during force reset:', error);
    }
  }
}

// Export singleton instance with default 5-minute timeout
export const timedEventManager = TimedEventManager.getInstance();