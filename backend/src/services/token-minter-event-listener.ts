import { parseAbiItem } from 'viem';
import { publicClient, supportsEventFiltering, supportsEventListening, needsPollingForEvents } from './viem-client.js';
import { CONTRACT_ADDRESSES, TOKEN_MINTER_ABI, NFT_MINTER_ABI, getContractAddresses, hasValidContractConfig } from '../config/contracts.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { DomainService } from './domain-service.js';
import { ConnectionManager } from './connection-manager.js';
import { WalletService } from './wallet-service.js';
import type { 
  TokenCreatedEvent,
  NFTReceivedEvent,
  FixedFeeUpdatedEvent,
  LaunchpadContractUpdatedEvent,
  ProceedsWithdrawnEvent,
  EventHandler 
} from '../types/events.js';

class TokenMinterEventListener {
  private unwatchTokenCreated: (() => void) | null = null;
  private unwatchNFTReceived: (() => void) | null = null;
  private unwatchFixedFeeUpdated: (() => void) | null = null;
  private unwatchLaunchpadContractUpdated: (() => void) | null = null;
  private unwatchProceedsWithdrawn: (() => void) | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isListening: boolean = false;
  private lastProcessedBlock: bigint = BigInt(0);

  // Event handlers
  private onTokenCreated: EventHandler<TokenCreatedEvent> = async (event, log) => {
    try {
      logger.event('TokenCreated', {
        nftId: event.nftId.toString(),
        tokenAddress: event.tokenAddress,
        tokenName: event.tokenName,
        receivedDirectly: event.receivedDirectly,
        feeAmount: event.feeAmount.toString(),
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      // Update the domain document with the ERC20 token address
      await this.updateDomainWithTokenAddress(event.nftId, event.tokenAddress);

    } catch (error) {
      logger.error('Error handling TokenCreated event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  private onNFTReceived: EventHandler<NFTReceivedEvent> = async (event, log) => {
    try {
      logger.event('NFTReceived', {
        tokenId: event.tokenId.toString(),
        from: event.from,
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      logger.info(`NFT received for token minting: Token ID ${event.tokenId} from ${event.from}`);

    } catch (error) {
      logger.error('Error handling NFTReceived event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  private onFixedFeeUpdated: EventHandler<FixedFeeUpdatedEvent> = async (event, log) => {
    try {
      logger.event('FixedFeeUpdated', {
        newFee: event.newFee.toString(),
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      logger.info(`Token minter fixed fee updated: ${event.newFee.toString()}`);

    } catch (error) {
      logger.error('Error handling FixedFeeUpdated event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  private onLaunchpadContractUpdated: EventHandler<LaunchpadContractUpdatedEvent> = async (event, log) => {
    try {
      logger.event('LaunchpadContractUpdated', {
        newLaunchpad: event.newLaunchpad,
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      logger.info(`Launchpad contract updated: ${event.newLaunchpad}`);

    } catch (error) {
      logger.error('Error handling LaunchpadContractUpdated event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  private onProceedsWithdrawn: EventHandler<ProceedsWithdrawnEvent> = async (event, log) => {
    try {
      logger.event('ProceedsWithdrawn', {
        to: event.to,
        amount: event.amount.toString(),
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      logger.info(`Proceeds withdrawn: ${event.amount.toString()} to ${event.to}`);

    } catch (error) {
      logger.error('Error handling ProceedsWithdrawn event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  /**
   * Update the domain document with the ERC20 token address
   * We need to find the domain name using the NFT ID first
   */
  private async updateDomainWithTokenAddress(nftId: bigint, tokenAddress: string): Promise<void> {
    try {
      logger.info(`🔄 Updating domain for NFT ID ${nftId.toString()} with ERC20 token address: ${tokenAddress}`);

      // Get the NFT contract address
      if (!('addresses' in CONTRACT_ADDRESSES) || !CONTRACT_ADDRESSES.addresses?.nftMinter) {
        throw new Error('NFT Minter contract address not configured');
      }

      const nftContractAddress = CONTRACT_ADDRESSES.addresses.nftMinter as `0x${string}`;

      // Get the domain name from the NFT contract using the token ID
      const domainNameFromContract = await WalletService.readContract(
        nftContractAddress,
        NFT_MINTER_ABI,
        'getTokenNameFromId',
        [nftId]
      ) as string;

      if (!domainNameFromContract || domainNameFromContract.trim() === '' || domainNameFromContract === '0x' || domainNameFromContract === '0') {
        logger.warn(`Could not get domain name for NFT ID ${nftId.toString()}, skipping ERC20 address update`);
        return;
      }

      const domainName = domainNameFromContract.trim();
      logger.info(`📛 Found domain name for NFT ID ${nftId.toString()}: ${domainName}`);

      // Find and update the domain document
      const domain = await DomainService.getDomainByName(domainName);
      
      if (!domain) {
        logger.warn(`Domain ${domainName} not found in database, cannot update ERC20 token address`);
        return;
      }

      // Update the domain with the ERC20 token address
      const domainsCollection = DomainService.getDomainsCollection();
      if (!domainsCollection) {
        throw new Error('Domains collection not available');
      }

      await domainsCollection.updateOne(
        { Domain_Name: domainName },
        { 
          $set: {
            Associated_ERC20_Addr: tokenAddress,
            updatedAt: new Date()
          }
        }
      );

      logger.info(`✅ Successfully updated domain ${domainName} with ERC20 token address: ${tokenAddress}`);

    } catch (error) {
      logger.error(`❌ Failed to update domain for NFT ID ${nftId.toString()} with token address ${tokenAddress}:`, error);
      throw error;
    }
  }

  /**
   * Polling-based event listening for networks like Flow
   */
  private async pollForEvents(): Promise<void> {
    if (!hasValidContractConfig()) {
      logger.error(`Token Minter contract address not configured for polling on Chain ID ${ENV.CHAIN_ID}`);
      return;
    }

    const addresses = getContractAddresses()!;
    const contractAddress = addresses.addresses.tokenMinter as `0x${string}`;

    try {
      // Get current block number
      const currentBlock = await publicClient.getBlockNumber();
      
      // If this is the first poll, start from recent blocks (last 1000 blocks or current block)
      if (this.lastProcessedBlock === BigInt(0)) {
        this.lastProcessedBlock = currentBlock > BigInt(1000) ? currentBlock - BigInt(1000) : BigInt(1);
        logger.info(`🔍 Starting Token minter event polling from block ${this.lastProcessedBlock} (current: ${currentBlock})`);
      }

      // Only poll if there are new blocks
      if (currentBlock <= this.lastProcessedBlock) {
        return;
      }

      const fromBlock = this.lastProcessedBlock + BigInt(1);
      const toBlock = currentBlock;

      logger.debug(`📊 Polling Token minter events from block ${fromBlock} to ${toBlock}`);

      // Get TokenCreated events
      const tokenCreatedEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event TokenCreated(uint256 indexed nftId, address tokenAddress, string tokenName, bool receivedDirectly, uint256 feeAmount)'),
        fromBlock,
        toBlock,
      });

      // Get NFTReceived events
      const nftReceivedEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event NFTReceived(uint256 indexed tokenId, address from)'),
        fromBlock,
        toBlock,
      });

      // Get FixedFeeUpdated events
      const fixedFeeUpdatedEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event FixedFeeUpdated(uint256 newFee)'),
        fromBlock,
        toBlock,
      });

      // Get LaunchpadContractUpdated events
      const launchpadContractUpdatedEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event LaunchpadContractUpdated(address newLaunchpad)'),
        fromBlock,
        toBlock,
      });

      // Get ProceedsWithdrawn events
      const proceedsWithdrawnEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event ProceedsWithdrawn(address to, uint256 amount)'),
        fromBlock,
        toBlock,
      });

      // Process TokenCreated events
      for (const log of tokenCreatedEvents) {
        if (log.args) {
          await this.onTokenCreated(log.args as TokenCreatedEvent, log);
        }
      }

      // Process NFTReceived events
      for (const log of nftReceivedEvents) {
        if (log.args) {
          await this.onNFTReceived(log.args as NFTReceivedEvent, log);
        }
      }

      // Process FixedFeeUpdated events
      for (const log of fixedFeeUpdatedEvents) {
        if (log.args) {
          await this.onFixedFeeUpdated(log.args as FixedFeeUpdatedEvent, log);
        }
      }

      // Process LaunchpadContractUpdated events
      for (const log of launchpadContractUpdatedEvents) {
        if (log.args) {
          await this.onLaunchpadContractUpdated(log.args as LaunchpadContractUpdatedEvent, log);
        }
      }

      // Process ProceedsWithdrawn events
      for (const log of proceedsWithdrawnEvents) {
        if (log.args) {
          await this.onProceedsWithdrawn(log.args as ProceedsWithdrawnEvent, log);
        }
      }

      // Update the last processed block
      this.lastProcessedBlock = toBlock;

      if (tokenCreatedEvents.length > 0 || nftReceivedEvents.length > 0 || fixedFeeUpdatedEvents.length > 0 || launchpadContractUpdatedEvents.length > 0 || proceedsWithdrawnEvents.length > 0) {
        logger.info(`📈 Token Minter: Processed ${tokenCreatedEvents.length} TokenCreated, ${nftReceivedEvents.length} NFTReceived, ${fixedFeeUpdatedEvents.length} FixedFeeUpdated, ${launchpadContractUpdatedEvents.length} LaunchpadContractUpdated, ${proceedsWithdrawnEvents.length} ProceedsWithdrawn events up to block ${toBlock}`);
      }

    } catch (error) {
      logger.error('Error polling for Token minter events:', error);
      await ConnectionManager.handleConnectionError(error, 'Token minter event polling');
    }
  }

  /**
   * Start filter-based event listening (for Ethereum networks)
   */
  private async startFilterBasedListening(contractAddress: `0x${string}`): Promise<void> {
    // Watch for TokenCreated events
    this.unwatchTokenCreated = publicClient.watchEvent({
        address: contractAddress,
        event: parseAbiItem('event TokenCreated(uint256 indexed nftId, address tokenAddress, string tokenName, bool receivedDirectly, uint256 feeAmount)'),
        pollingInterval: ENV.POLLING_INTERVAL,
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args) {
              this.onTokenCreated(log.args as TokenCreatedEvent, log);
            }
          });
        },
        onError: async (error) => {
          logger.error('Error watching TokenCreated events:', error);
          await ConnectionManager.handleConnectionError(error, 'TokenCreated event watcher');
        }
      });

      // Watch for NFTReceived events
      this.unwatchNFTReceived = publicClient.watchEvent({
        address: contractAddress,
        event: parseAbiItem('event NFTReceived(uint256 indexed tokenId, address from)'),
        pollingInterval: ENV.POLLING_INTERVAL,
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args) {
              this.onNFTReceived(log.args as NFTReceivedEvent, log);
            }
          });
        },
        onError: async (error) => {
          logger.error('Error watching NFTReceived events:', error);
          await ConnectionManager.handleConnectionError(error, 'NFTReceived event watcher');
        }
      });

      // Watch for FixedFeeUpdated events
      this.unwatchFixedFeeUpdated = publicClient.watchEvent({
        address: contractAddress,
        event: parseAbiItem('event FixedFeeUpdated(uint256 newFee)'),
        pollingInterval: ENV.POLLING_INTERVAL,
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args) {
              this.onFixedFeeUpdated(log.args as FixedFeeUpdatedEvent, log);
            }
          });
        },
        onError: async (error) => {
          logger.error('Error watching FixedFeeUpdated events:', error);
          await ConnectionManager.handleConnectionError(error, 'FixedFeeUpdated event watcher');
        }
      });

      // Watch for LaunchpadContractUpdated events
      this.unwatchLaunchpadContractUpdated = publicClient.watchEvent({
        address: contractAddress,
        event: parseAbiItem('event LaunchpadContractUpdated(address newLaunchpad)'),
        pollingInterval: ENV.POLLING_INTERVAL,
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args) {
              this.onLaunchpadContractUpdated(log.args as LaunchpadContractUpdatedEvent, log);
            }
          });
        },
        onError: async (error) => {
          logger.error('Error watching LaunchpadContractUpdated events:', error);
          await ConnectionManager.handleConnectionError(error, 'LaunchpadContractUpdated event watcher');
        }
      });

      // Watch for ProceedsWithdrawn events
      this.unwatchProceedsWithdrawn = publicClient.watchEvent({
        address: contractAddress,
        event: parseAbiItem('event ProceedsWithdrawn(address to, uint256 amount)'),
        pollingInterval: ENV.POLLING_INTERVAL,
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args) {
              this.onProceedsWithdrawn(log.args as ProceedsWithdrawnEvent, log);
            }
          });
        },
        onError: async (error) => {
          logger.error('Error watching ProceedsWithdrawn events:', error);
          await ConnectionManager.handleConnectionError(error, 'ProceedsWithdrawn event watcher');
        }
      });

      logger.info(`🎧 Started filter-based listening for Token minter events on contract: ${contractAddress}`);
    }

  /**
   * Start polling-based event listening (for Flow network)
   */
  private startPollingBasedListening(): void {
    this.pollingInterval = setInterval(async () => {
      await this.pollForEvents();
    }, ENV.POLLING_INTERVAL);

    logger.info(`🔄 Started polling-based Token minter event listening (interval: ${ENV.POLLING_INTERVAL}ms)`);
  }

  /**
   * Start listening for Token minter events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('Token Minter event listener is already running');
      return;
    }

    // Check if event listening is enabled
    if (!ENV.ENABLE_EVENT_LISTENERS) {
      logger.info('🔇 Token Minter event listeners are DISABLED (ENABLE_EVENT_LISTENERS=false)');
      return;
    }

    // Check if the current network supports event listening
    if (!supportsEventListening()) {
      logger.warn(`⚠️  Token Minter event listening not supported on Chain ID ${ENV.CHAIN_ID}`);
      logger.warn('   Token Minter event listeners will be skipped for this network.');
      logger.warn('   Supported networks: Sepolia (11155111), Flow (747)');
      return;
    }

    if (!hasValidContractConfig()) {
      throw new Error(`Token Minter contract address not configured for Chain ID ${ENV.CHAIN_ID}`);
    }

    const addresses = getContractAddresses()!;
    const contractAddress = addresses.addresses.tokenMinter as `0x${string}`;

    try {
      logger.info(`🎧 Starting Token Minter event listeners for Chain ID ${ENV.CHAIN_ID}`);
      
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
      logger.error('Failed to start Token minter event listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening for events
   */
  stopListening(): void {
    if (!this.isListening) {
      logger.warn('Token Minter event listener is not running');
      return;
    }

    try {
      // Stop filter-based listeners
      if (this.unwatchTokenCreated) {
        this.unwatchTokenCreated();
        this.unwatchTokenCreated = null;
      }

      if (this.unwatchNFTReceived) {
        this.unwatchNFTReceived();
        this.unwatchNFTReceived = null;
      }

      if (this.unwatchFixedFeeUpdated) {
        this.unwatchFixedFeeUpdated();
        this.unwatchFixedFeeUpdated = null;
      }

      if (this.unwatchLaunchpadContractUpdated) {
        this.unwatchLaunchpadContractUpdated();
        this.unwatchLaunchpadContractUpdated = null;
      }

      if (this.unwatchProceedsWithdrawn) {
        this.unwatchProceedsWithdrawn();
        this.unwatchProceedsWithdrawn = null;
      }

      // Stop polling-based listener
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }

      this.isListening = false;
      logger.info('🔇 Stopped listening for Token minter events');
    } catch (error) {
      logger.error('Error stopping Token minter event listener:', error);
    }
  }

  /**
   * Get listening status
   */
  getStatus(): boolean {
    return this.isListening;
  }

  /**
   * Restart the event listener (useful for reconnection scenarios)
   */
  async restart(): Promise<void> {
    logger.info('Restarting Token minter event listener...');
    this.stopListening();
    
    // Add a small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.startListening();
  }
}

// Create and export singleton instance
export const tokenMinterEventListener = new TokenMinterEventListener();
export default tokenMinterEventListener; 