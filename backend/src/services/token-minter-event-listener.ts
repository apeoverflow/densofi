import { parseAbiItem } from 'viem';
import { publicClient, supportsEventFiltering, supportsEventListening, needsPollingForEvents } from './viem-client.js';
import { CONTRACT_ADDRESSES, TOKEN_MINTER_ABI, NFT_MINTER_ABI } from '../config/contracts.js';
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

    if (!('addresses' in CONTRACT_ADDRESSES) || !CONTRACT_ADDRESSES.addresses?.tokenMinter) {
      throw new Error('Token Minter contract address not configured');
    }

    const contractAddress = CONTRACT_ADDRESSES.addresses.tokenMinter as `0x${string}`;

    try {
      logger.info(`🎧 Starting Token Minter event listeners for Chain ID ${ENV.CHAIN_ID}`);

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

      this.isListening = true;
      logger.info(`🎧 Started listening for Token minter events on contract: ${contractAddress}`);
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