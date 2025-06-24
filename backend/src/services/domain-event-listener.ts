import { parseAbiItem, formatEther } from 'viem';
import { publicClient, supportsEventFiltering, supportsEventListening, needsPollingForEvents } from './viem-client.js';
import { CONTRACT_ADDRESSES, DOMAIN_REGISTRATION_ABI, getContractAddresses, hasValidContractConfig } from '../config/contracts.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { DomainService } from './domain-service.js';
import { ConnectionManager } from './connection-manager.js';
import type { 
  RegistrationRequestedEvent, 
  OwnershipUpdateRequestedEvent,
  EventHandler 
} from '../types/events.js';

class DomainEventListener {
  private unwatchRegistration: (() => void) | null = null;
  private unwatchOwnershipUpdate: (() => void) | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isListening: boolean = false;
  private lastProcessedBlock: bigint = BigInt(0);

  // Event handlers
  private onRegistrationRequested: EventHandler<RegistrationRequestedEvent> = async (event, log) => {
    try {
      logger.event('RegistrationRequested', {
        domainName: event.domainName,
        requester: event.requester,
        fee: event.fee.toString(),
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      // Store pending registration in database
      await DomainService.storePendingRegistration({
        domainName: event.domainName,
        requester: event.requester,
        fee: event.fee,
        transactionHash: log.transactionHash || '',
        blockNumber: log.blockNumber || BigInt(0)
      });

    } catch (error) {
      logger.error('Error handling RegistrationRequested event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  private onOwnershipUpdateRequested: EventHandler<OwnershipUpdateRequestedEvent> = async (event, log) => {
    try {
      logger.event('OwnershipUpdateRequested', {
        domainName: event.domainName,
        requester: event.requester,
        fee: event.fee.toString(),
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      // Store pending ownership update in database
      await DomainService.storePendingOwnershipUpdate({
        domainName: event.domainName,
        requester: event.requester,
        fee: event.fee,
        transactionHash: log.transactionHash || '',
        blockNumber: log.blockNumber || BigInt(0)
      });

    } catch (error) {
      logger.error('Error handling OwnershipUpdateRequested event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  /**
   * Polling-based event listening for networks like Flow
   */
  private async pollForEvents(): Promise<void> {
    if (!hasValidContractConfig()) {
      logger.error(`Domain Registration contract address not configured for polling on Chain ID ${ENV.CHAIN_ID}`);
      return;
    }

    const addresses = getContractAddresses()!;
    const contractAddress = addresses.addresses.domainRegistration as `0x${string}`;

    try {
      // Get current block number
      const currentBlock = await publicClient.getBlockNumber();
      
      // If this is the first poll, start from recent blocks (last 1000 blocks or current block)
      if (this.lastProcessedBlock === BigInt(0)) {
        this.lastProcessedBlock = currentBlock > BigInt(1000) ? currentBlock - BigInt(1000) : BigInt(1);
        logger.info(`🔍 Starting event polling from block ${this.lastProcessedBlock} (current: ${currentBlock})`);
      }

      // Only poll if there are new blocks
      if (currentBlock <= this.lastProcessedBlock) {
        return;
      }

      const fromBlock = this.lastProcessedBlock + BigInt(1);
      const toBlock = currentBlock;

      logger.debug(`📊 Polling events from block ${fromBlock} to ${toBlock}`);

      // Get RegistrationRequested events
      const registrationEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event RegistrationRequested(string domainName, address requester, uint256 fee)'),
        fromBlock,
        toBlock,
      });

      // Get OwnershipUpdateRequested events
      const ownershipEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event OwnershipUpdateRequested(string domainName, address requester, uint256 fee)'),
        fromBlock,
        toBlock,
      });

      // Process registration events
      for (const log of registrationEvents) {
        if (log.args) {
          await this.onRegistrationRequested(log.args as RegistrationRequestedEvent, log);
        }
      }

      // Process ownership update events
      for (const ownershipEvent of ownershipEvents) {
        if (ownershipEvent.args) {
          await this.onOwnershipUpdateRequested(ownershipEvent.args as OwnershipUpdateRequestedEvent, ownershipEvent);
        }
      }

      // Update the last processed block
      this.lastProcessedBlock = toBlock;

      if (registrationEvents.length > 0 || ownershipEvents.length > 0) {
        logger.info(`📈 Processed ${registrationEvents.length} registration events and ${ownershipEvents.length} ownership events up to block ${toBlock}`);
      }

    } catch (error) {
      logger.error('Error polling for events:', error);
      await ConnectionManager.handleConnectionError(error, 'Event polling');
    }
  }

  /**
   * Start filter-based event listening (for Ethereum networks)
   */
  private async startFilterBasedListening(contractAddress: `0x${string}`): Promise<void> {
    // Watch for RegistrationRequested events
    this.unwatchRegistration = publicClient.watchEvent({
      address: contractAddress,
      event: parseAbiItem('event RegistrationRequested(string domainName, address requester, uint256 fee)'),
      pollingInterval: ENV.POLLING_INTERVAL,
      onLogs: (logs) => {
        logs.forEach(log => {
          if (log.args) {
            this.onRegistrationRequested(log.args as RegistrationRequestedEvent, log);
          }
        });
      },
      onError: async (error) => {
        logger.error('Error watching RegistrationRequested events:', error);
        await ConnectionManager.handleConnectionError(error, 'RegistrationRequested event watcher');
      }
    });

    // Watch for OwnershipUpdateRequested events
    this.unwatchOwnershipUpdate = publicClient.watchEvent({
      address: contractAddress,
      event: parseAbiItem('event OwnershipUpdateRequested(string domainName, address requester, uint256 fee)'),
      pollingInterval: ENV.POLLING_INTERVAL,
      onLogs: (logs) => {
        logs.forEach(log => {
          if (log.args) {
            this.onOwnershipUpdateRequested(log.args as OwnershipUpdateRequestedEvent, log);
          }
        });
      },
      onError: async (error) => {
        logger.error('Error watching OwnershipUpdateRequested events:', error);
        await ConnectionManager.handleConnectionError(error, 'OwnershipUpdateRequested event watcher');
      }
    });

    logger.info(`🎧 Started filter-based event listening on contract: ${contractAddress}`);
  }

  /**
   * Start polling-based event listening (for Flow network)
   */
  private startPollingBasedListening(): void {
    this.pollingInterval = setInterval(async () => {
      await this.pollForEvents();
    }, ENV.POLLING_INTERVAL);

    logger.info(`🔄 Started polling-based event listening (interval: ${ENV.POLLING_INTERVAL}ms)`);
  }

  /**
   * Start listening for domain registration events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('Event listener is already running');
      return;
    }

    // Check if event listening is enabled
    if (!ENV.ENABLE_EVENT_LISTENERS) {
      logger.info('🔇 Event listeners are DISABLED (ENABLE_EVENT_LISTENERS=false)');
      return;
    }

    // Check if the current network supports event listening
    if (!supportsEventListening()) {
      logger.warn(`⚠️  Event listening not supported on Chain ID ${ENV.CHAIN_ID}`);
      logger.warn('   Event listeners will be skipped for this network.');
      logger.warn('   Supported networks: Sepolia (11155111), Flow (747)');
      return;
    }

    if (!hasValidContractConfig()) {
      throw new Error(`Domain Registration contract address not configured for Chain ID ${ENV.CHAIN_ID}`);
    }

    const addresses = getContractAddresses()!;
    const contractAddress = addresses.addresses.domainRegistration as `0x${string}`;

    try {
      logger.info(`🎧 Starting event listeners for Chain ID ${ENV.CHAIN_ID}`);
      
      if (needsPollingForEvents()) {
        // Use polling for Flow network
        logger.info('🔄 Using polling-based event listening for Flow network');
        this.startPollingBasedListening();
      } else if (supportsEventFiltering()) {
        // Use filter-based listening for Ethereum networks
        logger.info('📡 Using filter-based event listening');
        await this.startFilterBasedListening(contractAddress);
      }

      this.isListening = true;
      logger.info(`📊 Polling interval: ${ENV.POLLING_INTERVAL}ms`);

    } catch (error) {
      logger.error('Failed to start event listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening for events
   */
  stopListening(): void {
    if (!this.isListening) {
      logger.warn('Event listener is not running');
      return;
    }

    try {
      // Stop filter-based listeners
      if (this.unwatchRegistration) {
        this.unwatchRegistration();
        this.unwatchRegistration = null;
      }

      if (this.unwatchOwnershipUpdate) {
        this.unwatchOwnershipUpdate();
        this.unwatchOwnershipUpdate = null;
      }

      // Stop polling-based listener
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      this.isListening = false;
      logger.info('🔇 Stopped listening for domain registration events');
    } catch (error) {
      logger.error('Error stopping event listener:', error);
    }
  }

  /**
   * Get listening status
   */
  getStatus(): boolean {
    return this.isListening;
  }

  /**
   * Check if event listening is supported on current network
   */
  isSupported(): boolean {
    return ENV.ENABLE_EVENT_LISTENERS && supportsEventListening();
  }

  /**
   * Get current event listening method
   */
  getListeningMethod(): string {
    if (!this.isListening) return 'Not listening';
    if (needsPollingForEvents()) return 'Polling-based';
    if (supportsEventFiltering()) return 'Filter-based';
    return 'Unknown';
  }

  /**
   * Restart the event listener (useful for reconnection scenarios)
   */
  async restart(): Promise<void> {
    logger.info('Restarting event listener...');
    this.stopListening();
    
    // Add a small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.startListening();
  }
}

// Create and export singleton instance
export const domainEventListener = new DomainEventListener();
export default domainEventListener; 