import { type Address, type Hex } from 'viem';
import { WalletService } from './wallet-service.js';
import {SEPOLIA_ADDRESSES} from '../config/contracts.js';
import { logger } from '../utils/logger.js';

// NFTMinter contract ABI - focusing on the functions we need
import { NFT_MINTER_ABI } from '../config/contracts.js';

export class NFTMinterService {
  private static contractAddress: Address;

  /**
   * Initialize the NFTMinter service
   */
  static async initialize(): Promise<void> {
    try {
      // Make sure WalletService is initialized
      await WalletService.initialize();

      if (!SEPOLIA_ADDRESSES.NFTMinter) {
        throw new Error('domain  environment variable is required');
      }

      this.contractAddress = SEPOLIA_ADDRESSES.NFTMinter as Address;

      logger.info('✅ NFTMinter service initialized successfully');
      logger.info(`   Contract: ${this.contractAddress}`);
    } catch (error) {
      logger.error('❌ Failed to initialize NFTMinter service:', error);
      throw error;
    }
  }

  /**
   * Set a domain as mintable (admin only function)
   * @param domainName The domain name to set as mintable
   * @param isMintable Whether the domain should be mintable (default: true)
   * @returns Transaction hash
   */
  static async setDomainMintable(domainName: string, isMintable: boolean = true): Promise<Hex> {
    try {
      logger.info(`📝 Setting domain mintable status: ${domainName} -> ${isMintable}`);
      
      const hash = await WalletService.writeContract(
        this.contractAddress,
        NFT_MINTER_ABI,
        'setIsDomainMintable',
        [domainName, isMintable]
      );

      logger.info(`✅ Domain mintable status set successfully`);
      logger.info(`   Domain: ${domainName}`);
      logger.info(`   Mintable: ${isMintable}`);
      logger.info(`   Transaction: ${hash}`);

      return hash;
    } catch (error) {
      logger.error(`❌ Failed to set domain mintable status for ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Set the owner of a domain (admin only function)
   * @param domainName The domain name
   * @param ownerAddress The address of the domain owner
   * @returns Transaction hash
   */
  static async setDomainOwner(domainName: string, ownerAddress: Address): Promise<Hex> {
    try {
      logger.info(`👤 Setting domain owner: ${domainName} -> ${ownerAddress}`);
      
      const hash = await WalletService.writeContract(
        this.contractAddress,
        NFT_MINTER_ABI,
        'setDomainNameToOwner',
        [domainName, ownerAddress]
      );

      logger.info(`✅ Domain owner set successfully`);
      logger.info(`   Domain: ${domainName}`);
      logger.info(`   Owner: ${ownerAddress}`);
      logger.info(`   Transaction: ${hash}`);

      return hash;
    } catch (error) {
      logger.error(`❌ Failed to set domain owner for ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Check if a domain is mintable
   * @param domainName The domain name to check
   * @returns Whether the domain is mintable
   */
  static async isDomainMintable(domainName: string): Promise<boolean> {
    try {
      const result = await WalletService.readContract(
        this.contractAddress,
        NFT_MINTER_ABI,
        'isDomainMintable',
        [domainName]
      );

      logger.info(`🔍 Domain mintable status: ${domainName} -> ${result}`);
      return result as boolean;
    } catch (error) {
      logger.error(`❌ Failed to check domain mintable status for ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Get the owner of a domain
   * @param domainName The domain name
   * @returns The address of the domain owner
   */
  static async getDomainOwner(domainName: string): Promise<Address> {
    try {
      const result = await WalletService.readContract(
        this.contractAddress,
        NFT_MINTER_ABI,
        'getDomainOwner',
        [domainName]
      );

      logger.info(`👤 Domain owner: ${domainName} -> ${result}`);
      return result as Address;
    } catch (error) {
      logger.error(`❌ Failed to get domain owner for ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Get the token ID for a domain
   * @param domainName The domain name
   * @returns The token ID (0 if not minted)
   */
  static async getTokenIdForDomain(domainName: string): Promise<bigint> {
    try {
      const result = await WalletService.readContract(
        this.contractAddress,
        NFT_MINTER_ABI,
        'getTokenIdForDomain',
        [domainName]
      );

      logger.info(`🎫 Token ID for domain: ${domainName} -> ${result}`);
      return result as bigint;
    } catch (error) {
      logger.error(`❌ Failed to get token ID for ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Process a domain registration by setting it as mintable and setting the owner
   * This combines both operations in sequence
   * @param domainName The domain name
   * @param ownerAddress The address of the domain owner
   * @returns Object containing both transaction hashes
   */
  static async processDomainRegistration(
    domainName: string, 
    ownerAddress: Address
  ): Promise<{ setOwnerTx: Hex; setMintableTx: Hex }> {
    try {
      logger.info(`🚀 Processing domain registration: ${domainName} for ${ownerAddress}`);

      // First, set the domain owner
      const setOwnerTx = await this.setDomainOwner(domainName, ownerAddress);
      
      // Wait for the first transaction to be confirmed
      await WalletService.waitForTransactionReceipt(setOwnerTx);

      // Then, set the domain as mintable
      const setMintableTx = await this.setDomainMintable(domainName, true);
      
      // Wait for the second transaction to be confirmed
      await WalletService.waitForTransactionReceipt(setMintableTx);

      logger.info(`✅ Domain registration processed successfully`);
      logger.info(`   Domain: ${domainName}`);
      logger.info(`   Owner: ${ownerAddress}`);
      logger.info(`   Set Owner Tx: ${setOwnerTx}`);
      logger.info(`   Set Mintable Tx: ${setMintableTx}`);

      return { setOwnerTx, setMintableTx };
    } catch (error) {
      logger.error(`❌ Failed to process domain registration for ${domainName}:`, error);
      throw error;
    }
  }

  /**
   * Get the contract address
   */
  static getContractAddress(): Address {
    return this.contractAddress;
  }

  /**
   * Get the contract ABI
   */
  static getContractABI() {
    return NFT_MINTER_ABI;
  }
} 