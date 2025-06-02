import { Collection } from 'mongodb';
import { MongoService } from './mongo-service.js';
import { logger } from '../utils/logger.js';
import type { 
  Domain, 
  DomainDocument, 
  PendingRegistration, 
  PendingOwnershipUpdate 
} from '../models/domain.js';
import { DnsVerificationService } from './dns-verification-service.js';
import { ENV } from '../config/env.js';
import { NFTMinterService } from './nft-minter-service.js';
import { type Address } from 'viem';

export class DomainService {
  private static domainsCollection: Collection<DomainDocument> | null = null;
  private static pendingRegistrationsCollection: Collection<PendingRegistration> | null = null;
  private static pendingOwnershipUpdatesCollection: Collection<PendingOwnershipUpdate> | null = null;

  /**
   * Initialize the domain service and ensure collections exist
   */
  static async initialize(): Promise<void> {
    try {
      this.domainsCollection = MongoService.getCollection<DomainDocument>('domains');
      this.pendingRegistrationsCollection = MongoService.getCollection<PendingRegistration>('pending_registrations');
      this.pendingOwnershipUpdatesCollection = MongoService.getCollection<PendingOwnershipUpdate>('pending_ownership_updates');

      // Create indexes for better performance
      await this.createIndexes();
      
      logger.info('Domain service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize domain service:', error);
      throw error;
    }
  }

  /**
   * Create database indexes for better performance
   */
  private static async createIndexes(): Promise<void> {
    if (!this.domainsCollection || !this.pendingRegistrationsCollection || !this.pendingOwnershipUpdatesCollection) {
      throw new Error('Collections not initialized');
    }

    try {
      // Create unique index on domain name
      await this.domainsCollection.createIndex({ Domain_Name: 1 }, { unique: true });
      
      // Create indexes for pending collections
      await this.pendingRegistrationsCollection.createIndex({ domainName: 1 });
      await this.pendingRegistrationsCollection.createIndex({ transactionHash: 1 }, { unique: true });
      await this.pendingRegistrationsCollection.createIndex({ processed: 1 });
      
      await this.pendingOwnershipUpdatesCollection.createIndex({ domainName: 1 });
      await this.pendingOwnershipUpdatesCollection.createIndex({ transactionHash: 1 }, { unique: true });
      await this.pendingOwnershipUpdatesCollection.createIndex({ processed: 1 });
      
      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Error creating database indexes:', error);
    }
  }

  /**
   * Check if a domain is already registered
   */
  static async isDomainRegistered(domainName: string): Promise<boolean> {
    if (!this.domainsCollection) {
      throw new Error('Domain service not initialized');
    }

    try {
      const domain = await this.domainsCollection.findOne({ Domain_Name: domainName });
      return domain !== null;
    } catch (error) {
      logger.error(`Error checking domain registration for ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Store a pending registration request
   */
  static async storePendingRegistration(registration: Omit<PendingRegistration, 'timestamp' | 'processed'>): Promise<void> {
    if (!this.pendingRegistrationsCollection) {
      throw new Error('Domain service not initialized');
    }

    try {
      const pendingRegistration: PendingRegistration = {
        ...registration,
        timestamp: new Date(),
        processed: false
      };

      await this.pendingRegistrationsCollection.insertOne(pendingRegistration);
      logger.info(`Stored pending registration for domain: ${registration.domainName}`);
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error - transaction already processed
        logger.warn(`Registration request already exists for transaction: ${registration.transactionHash}`);
        return;
      }
      logger.error(`Error storing pending registration for ${registration.domainName}:`, error);
      throw error;
    }
  }

  /**
   * Store a pending ownership update request
   */
  static async storePendingOwnershipUpdate(update: Omit<PendingOwnershipUpdate, 'timestamp' | 'processed'>): Promise<void> {
    if (!this.pendingOwnershipUpdatesCollection) {
      throw new Error('Domain service not initialized');
    }

    try {
      const pendingUpdate: PendingOwnershipUpdate = {
        ...update,
        timestamp: new Date(),
        processed: false
      };

      await this.pendingOwnershipUpdatesCollection.insertOne(pendingUpdate);
      logger.info(`Stored pending ownership update for domain: ${update.domainName}`);
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error - transaction already processed
        logger.warn(`Ownership update request already exists for transaction: ${update.transactionHash}`);
        return;
      }
      logger.error(`Error storing pending ownership update for ${update.domainName}:`, error);
      throw error;
    }
  }

  /**
   * Process pending domain registrations from database and update blockchain state
   */
  static async processPendingRegistrations(): Promise<void> {
    try {
      if (!this.pendingRegistrationsCollection) {
        throw new Error('DomainService not initialized');
      }

      logger.info('🔄 Processing pending domain registrations...');

      const pendingRegistrations = await this.pendingRegistrationsCollection
        .find({ processed: false })
        .limit(30) // Process in batches to avoid overwhelming the system
        .toArray();

      if (pendingRegistrations.length === 0) {
        logger.info('✅ No pending registrations to process');
        return;
      }

      logger.info(`📝 Found ${pendingRegistrations.length} pending registrations`);

      for (const registration of pendingRegistrations) {
        try {
          logger.info(`\n🚀 Processing registration: ${registration.domainName}`);
          
          // Store the domain in our database using the correct interface
          const domainData: DomainDocument = {
            Domain_Name: registration.domainName,
            Associated_ERC20_Addr: '', // Empty for now
            Verified_Owner_Addr: registration.requester,
            Chain_Id: BigInt(ENV.CHAIN_ID || '11155111'),
            NFT_Token_Id: BigInt(0), // Will be set when NFT is minted
            Expiration_Timestamp: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Check if domain already exists
          const existingDomain = await this.domainsCollection!.findOne({
            Domain_Name: registration.domainName
          });

          if (!existingDomain) {
            await this.domainsCollection!.insertOne(domainData);
            logger.info(`✅ Domain stored in database: ${registration.domainName}`);
          } else {
            await this.domainsCollection!.updateOne(
              { Domain_Name: registration.domainName },
              { $set: { ...domainData, updatedAt: new Date() } }
            );
            logger.info(`✅ Domain updated in database: ${registration.domainName}`);
          }

          // Process the domain on the blockchain using NFTMinterService
          try {
            logger.info(`⛓️  Processing domain on blockchain: ${registration.domainName}`);
            
            // Initialize NFTMinterService if not already initialized
            await NFTMinterService.initialize();
            
            // Set domain owner and make it mintable on the blockchain
            const result = await NFTMinterService.processDomainRegistration(
              registration.domainName,
              registration.requester as Address // Use requester from PendingRegistration
            );

            logger.info(`✅ Blockchain processing complete for ${registration.domainName}`);
            logger.info(`   Set Owner Tx: ${result.setOwnerTx}`);
            logger.info(`   Set Mintable Tx: ${result.setMintableTx}`);

          } catch (blockchainError) {
            logger.error(`❌ Blockchain processing failed for ${registration.domainName}:`, blockchainError);
          }

          // Mark the pending registration as processed
          await this.pendingRegistrationsCollection.updateOne(
            { _id: registration._id },
            { 
              $set: { 
                processed: true, 
                processedAt: new Date() 
              } 
            }
          );

          logger.info(`✅ Registration processing complete: ${registration.domainName}`);

        } catch (error) {
          logger.error(`❌ Failed to process registration for ${registration.domainName}:`, error);
          
          // Mark as processed with error
          await this.pendingRegistrationsCollection.updateOne(
            { _id: registration._id },
            { 
              $set: { 
                processed: true, 
                processedAt: new Date(),
                processingError: (error as Error).message
              } 
            }
          );
        }
      }

      logger.info(`✅ Batch processing complete. Processed ${pendingRegistrations.length} registrations`);

    } catch (error) {
      logger.error('❌ Error processing pending registrations:', error);
      throw error;
    }
  }

  /**
   * Process pending ownership updates from database and update blockchain state
   */
  static async processPendingOwnershipUpdates(): Promise<void> {
    if (!this.pendingOwnershipUpdatesCollection || !this.domainsCollection) {
      throw new Error('Domain service not initialized');
    }

    logger.info('🔄 Processing pending ownership updates...');

    try {
      const pendingUpdates = await this.pendingOwnershipUpdatesCollection
        .find({ processed: false })
        .limit(10) // Process in batches to avoid overwhelming the system
        .toArray();

      if (pendingUpdates.length === 0) {
        logger.info('✅ No pending ownership updates to process');
        return;
      }

      logger.info(`📝 Found ${pendingUpdates.length} pending ownership updates`);

      for (const update of pendingUpdates) {
        try {
          logger.info(`\n🔄 Processing ownership update for domain: ${update.domainName}`);

          // Find the domain in our database
          const existingDomain = await this.domainsCollection.findOne({
            Domain_Name: update.domainName
          });

          if (!existingDomain) {
            logger.warn(`Domain ${update.domainName} not found in database, skipping ownership update.`);
            await this.pendingOwnershipUpdatesCollection.updateOne(
              { _id: update._id },
              { $set: { processed: true, processedAt: new Date(), processingError: 'Domain not found in database' } }
            );
            continue;
          }

          // Update the domain owner on the blockchain
          try {
            logger.info(`⛓️  Updating domain owner on blockchain for: ${update.domainName}`);

            // Initialize NFTMinterService if not already initialized
            await NFTMinterService.initialize();
            
            const setOwnerTx = await NFTMinterService.setDomainOwner(
              update.domainName,
              update.requester as Address // Use requester from PendingOwnershipUpdate
            );

            logger.info(`✅ Blockchain owner update complete for ${update.domainName}`);
            logger.info(`   Set Owner Tx: ${setOwnerTx}`);

            // Update the domain document with blockchain transaction hash
            await this.domainsCollection.updateOne(
              { Domain_Name: update.domainName },
              { 
                $set: {
                  Verified_Owner_Addr: update.requester,
                  updatedAt: new Date()
                },
                $setOnInsert: {
                  blockchainOwnershipUpdateTxHash: setOwnerTx,
                  lastBlockchainUpdate: new Date()
                }
              },
              { upsert: true }
            );

          } catch (blockchainError) {
            logger.error(`❌ Blockchain ownership update failed for ${update.domainName}:`, blockchainError);

            // Mark as processed but with blockchain error
            await this.domainsCollection.updateOne(
              { Domain_Name: update.domainName },
              { 
                $set: {
                  updatedAt: new Date()
                },
                $setOnInsert: {
                  blockchainOwnershipUpdateTxHash: null,
                  blockchainError: (blockchainError as Error).message,
                  lastBlockchainUpdate: new Date()
                }
              },
              { upsert: true }
            );
          }

          // Mark the pending ownership update as processed
          await this.pendingOwnershipUpdatesCollection.updateOne(
            { _id: update._id },
            { 
              $set: { 
                processed: true, 
                processedAt: new Date() 
              } 
            }
          );

          logger.info(`✅ Ownership update processing complete: ${update.domainName}`);

        } catch (error) {
          logger.error(`❌ Failed to process ownership update for ${update.domainName}:`, error);
          
          // Mark as processed with error
          await this.pendingOwnershipUpdatesCollection.updateOne(
            { _id: update._id },
            { 
              $set: { 
                processed: true, 
                processedAt: new Date(),
                processingError: (error as Error).message
              } 
            }
          );
        }
      }

      logger.info(`✅ Batch processing complete. Processed ${pendingUpdates.length} ownership updates`);

    } catch (error) {
      logger.error('❌ Error processing pending ownership updates:', error);
      throw error;
    }
  }

  /**
   * Get all registered domains
   */
  static async getAllDomains(): Promise<DomainDocument[]> {
    if (!this.domainsCollection) {
      throw new Error('Domain service not initialized');
    }

    try {
      const domains = await this.domainsCollection.find({}).toArray();
      return domains;
    } catch (error) {
      logger.error('Error getting all domains:', error);
      throw error;
    }
  }

  /**
   * Get a domain by name
   */
  static async getDomainByName(domainName: string): Promise<DomainDocument | null> {
    if (!this.domainsCollection) {
      throw new Error('Domain service not initialized');
    }

    try {
      const domain = await this.domainsCollection.findOne({ Domain_Name: domainName });
      return domain;
    } catch (error) {
      logger.error(`Error getting domain by name ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Verify domain ownership via DNS (e.g., TXT record check)
   */
  static async verifyDomainViaDns(domainName: string, walletAddress: string): Promise<boolean> {
    // This is a placeholder for actual DNS verification logic
    // In a real application, you would query DNS records for the domain
    // and check if a specific TXT record (e.g., _owner.domain.com) matches the walletAddress
    logger.info(`Verifying domain ${domainName} via DNS for wallet ${walletAddress}`);
    
    const isVerified = await DnsVerificationService.verifyDomainOwnership(domainName, walletAddress);
    
    if (isVerified) {
      logger.info(`Domain ${domainName} successfully verified via DNS for wallet ${walletAddress}`);
    } else {
      logger.warn(`Domain ${domainName} DNS verification failed for wallet ${walletAddress}`);
    }

    return isVerified;
  }
} 