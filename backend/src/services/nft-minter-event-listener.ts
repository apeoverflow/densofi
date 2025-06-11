import { parseAbiItem } from 'viem';
import { publicClient } from './viem-client.js';
import { SEPOLIA_ADDRESSES, NFT_MINTER_ABI } from '../config/contracts.js';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { DomainService } from './domain-service.js';
import { ConnectionManager } from './connection-manager.js';
import type { 
  NFTMintedEvent,
  DomainOwnerSetEvent,
  DomainMintableStatusSetEvent,
  DomainNFTMintedStatusSetEvent,
  EventHandler 
} from '../types/events.js';

class NFTMinterEventListener {
  private unwatchNFTMinted: (() => void) | null = null;
  private unwatchDomainOwnerSet: (() => void) | null = null;
  private unwatchDomainMintableStatusSet: (() => void) | null = null;
  private unwatchDomainNFTMintedStatusSet: (() => void) | null = null;
  private isListening: boolean = false;

  // Event handlers
  private onNFTMinted: EventHandler<NFTMintedEvent> = async (event, log) => {
    try {
      logger.event('NFTMinted', {
        tokenId: event.tokenId.toString(),
        to: event.to,
        domainNameHash: event.domainNameHash,
        domainName: event.domainName,
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      // Update the domain document with the NFT token ID
      await this.updateDomainWithTokenId(event.domainName, event.tokenId);

    } catch (error) {
      logger.error('Error handling NFTMinted event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  private onDomainOwnerSet: EventHandler<DomainOwnerSetEvent> = async (event, log) => {
    try {
      logger.event('DomainOwnerSet', {
        domainNameHash: event.domainNameHash,
        owner: event.owner,
        domainName: event.domainName,
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      // This event is already handled by the domain service during registration
      // But we can log it for monitoring purposes
      logger.info(`Domain owner set on blockchain: ${event.domainName} -> ${event.owner}`);

    } catch (error) {
      logger.error('Error handling DomainOwnerSet event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  private onDomainMintableStatusSet: EventHandler<DomainMintableStatusSetEvent> = async (event, log) => {
    try {
      logger.event('DomainMintableStatusSet', {
        domainNameHash: event.domainNameHash,
        isMintable: event.isMintable,
        domainName: event.domainName,
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      logger.info(`Domain mintable status updated: ${event.domainName} -> ${event.isMintable}`);

    } catch (error) {
      logger.error('Error handling DomainMintableStatusSet event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  private onDomainNFTMintedStatusSet: EventHandler<DomainNFTMintedStatusSetEvent> = async (event, log) => {
    try {
      logger.event('DomainNFTMintedStatusSet', {
        domainNameHash: event.domainNameHash,
        isMinted: event.isMinted,
        domainName: event.domainName,
        blockNumber: log.blockNumber?.toString() || 'unknown',
        transactionHash: log.transactionHash,
      });

      logger.info(`Domain NFT minted status updated: ${event.domainName} -> ${event.isMinted}`);

    } catch (error) {
      logger.error('Error handling DomainNFTMintedStatusSet event:', error);
      // Don't rethrow to prevent stopping the listener
    }
  };

  /**
   * Update the domain document with the NFT token ID
   */
  private async updateDomainWithTokenId(domainName: string, tokenId: bigint): Promise<void> {
    try {
      logger.info(`🔄 Updating domain ${domainName} with NFT token ID: ${tokenId.toString()}`);

      // Find and update the domain document
      const domain = await DomainService.getDomainByName(domainName);
      
      if (!domain) {
        logger.warn(`Domain ${domainName} not found in database, cannot update token ID`);
        return;
      }

      // Update the domain with the NFT token ID
      const domainsCollection = DomainService.getDomainsCollection();
      if (!domainsCollection) {
        throw new Error('Domains collection not available');
      }

      await domainsCollection.updateOne(
        { Domain_Name: domainName },
        { 
          $set: {
            NFT_Token_Id: tokenId,
            updatedAt: new Date()
          }
        }
      );

      logger.info(`✅ Successfully updated domain ${domainName} with NFT token ID: ${tokenId.toString()}`);

    } catch (error) {
      logger.error(`❌ Failed to update domain ${domainName} with token ID ${tokenId.toString()}:`, error);
      throw error;
    }
  }

  /**
   * Start listening for NFT minter events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('NFT Minter event listener is already running');
      return;
    }

    try {
      // Watch for NFTMinted events
      this.unwatchNFTMinted = publicClient.watchEvent({
        address: SEPOLIA_ADDRESSES.NFTMinter,
        event: parseAbiItem('event NFTMinted(uint256 indexed tokenId, address indexed to, bytes32 domainNameHash, string domainName)'),
        pollingInterval: ENV.POLLING_INTERVAL,
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args) {
              this.onNFTMinted(log.args as NFTMintedEvent, log);
            }
          });
        },
        onError: async (error) => {
          logger.error('Error watching NFTMinted events:', error);
          await ConnectionManager.handleConnectionError(error, 'NFTMinted event watcher');
        }
      });

      // Watch for DomainOwnerSet events
      this.unwatchDomainOwnerSet = publicClient.watchEvent({
        address: SEPOLIA_ADDRESSES.NFTMinter,
        event: parseAbiItem('event DomainOwnerSet(bytes32 indexed domainNameHash, address owner, string domainName)'),
        pollingInterval: ENV.POLLING_INTERVAL,
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args) {
              this.onDomainOwnerSet(log.args as DomainOwnerSetEvent, log);
            }
          });
        },
        onError: async (error) => {
          logger.error('Error watching DomainOwnerSet events:', error);
          await ConnectionManager.handleConnectionError(error, 'DomainOwnerSet event watcher');
        }
      });

      // Watch for DomainMintableStatusSet events
      this.unwatchDomainMintableStatusSet = publicClient.watchEvent({
        address: SEPOLIA_ADDRESSES.NFTMinter,
        event: parseAbiItem('event DomainMintableStatusSet(bytes32 indexed domainNameHash, bool isMintable, string domainName)'),
        pollingInterval: ENV.POLLING_INTERVAL,
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args) {
              this.onDomainMintableStatusSet(log.args as DomainMintableStatusSetEvent, log);
            }
          });
        },
        onError: async (error) => {
          logger.error('Error watching DomainMintableStatusSet events:', error);
          await ConnectionManager.handleConnectionError(error, 'DomainMintableStatusSet event watcher');
        }
      });

      // Watch for DomainNFTMintedStatusSet events
      this.unwatchDomainNFTMintedStatusSet = publicClient.watchEvent({
        address: SEPOLIA_ADDRESSES.NFTMinter,
        event: parseAbiItem('event DomainNFTMintedStatusSet(bytes32 indexed domainNameHash, bool isMinted, string domainName)'),
        pollingInterval: ENV.POLLING_INTERVAL,
        onLogs: (logs) => {
          logs.forEach(log => {
            if (log.args) {
              this.onDomainNFTMintedStatusSet(log.args as DomainNFTMintedStatusSetEvent, log);
            }
          });
        },
        onError: async (error) => {
          logger.error('Error watching DomainNFTMintedStatusSet events:', error);
          await ConnectionManager.handleConnectionError(error, 'DomainNFTMintedStatusSet event watcher');
        }
      });

      this.isListening = true;
      logger.info(`🎧 Started listening for NFT minter events on contract: ${SEPOLIA_ADDRESSES.NFTMinter}`);
      logger.info(`📊 Polling interval: ${ENV.POLLING_INTERVAL}ms`);

    } catch (error) {
      logger.error('Failed to start NFT minter event listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening for events
   */
  stopListening(): void {
    if (!this.isListening) {
      logger.warn('NFT Minter event listener is not running');
      return;
    }

    try {
      if (this.unwatchNFTMinted) {
        this.unwatchNFTMinted();
        this.unwatchNFTMinted = null;
      }

      if (this.unwatchDomainOwnerSet) {
        this.unwatchDomainOwnerSet();
        this.unwatchDomainOwnerSet = null;
      }

      if (this.unwatchDomainMintableStatusSet) {
        this.unwatchDomainMintableStatusSet();
        this.unwatchDomainMintableStatusSet = null;
      }

      if (this.unwatchDomainNFTMintedStatusSet) {
        this.unwatchDomainNFTMintedStatusSet();
        this.unwatchDomainNFTMintedStatusSet = null;
      }

      this.isListening = false;
      logger.info('🔇 Stopped listening for NFT minter events');
    } catch (error) {
      logger.error('Error stopping NFT minter event listener:', error);
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
    logger.info('Restarting NFT minter event listener...');
    this.stopListening();
    
    // Add a small delay to ensure cleanup is complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.startListening();
  }
}

// Create and export singleton instance
export const nftMinterEventListener = new NFTMinterEventListener();
export default nftMinterEventListener; 