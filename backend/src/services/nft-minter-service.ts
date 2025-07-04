import { type Address, type Hex } from 'viem';
import { WalletService } from './wallet-service.js';
import {CONTRACT_ADDRESSES} from '../config/contracts.js';
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

      if (!('addresses' in CONTRACT_ADDRESSES) || !CONTRACT_ADDRESSES.addresses?.nftMinter) {
        throw new Error('NFTMinter contract address is required');
      }

      this.contractAddress = CONTRACT_ADDRESSES.addresses.nftMinter as Address;

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
   * Get NFTs owned by an address
   * Since this is an ERC1155 contract, we need to check balances for known token IDs
   * @param ownerAddress The address to check NFTs for
   * @returns Array of NFT information
   */
  static async getNFTsForOwner(ownerAddress: Address): Promise<Array<{
    tokenId: string;
    balance: string;
    domainName: string;
    title: string;
    description: string;
    image: string;
  }>> {
    try {
      logger.info(`🔍 Fetching NFTs for address: ${ownerAddress}`);
      
      // Get the current token counter to know how many tokens exist
      const tokenCounter = await WalletService.readContract(
        this.contractAddress,
        NFT_MINTER_ABI,
        's_tokenCounter',
        []
      ) as bigint;

      const nfts = [];
      
      // Check balance for each existing token ID
      for (let tokenId = 1n; tokenId <= tokenCounter; tokenId++) {
        try {
          // Check balance for this token ID
          const balance = await WalletService.readContract(
            this.contractAddress,
            NFT_MINTER_ABI,
            'balanceOf',
            [ownerAddress, tokenId]
          ) as bigint;

          // If balance > 0, user owns this NFT
          if (balance > 0n) {
            // Try to get domain name for this token ID
            let domainName = `Domain #${tokenId}`;
            let metadataUri = '';
            
            try {
              const tokenName = await WalletService.readContract(
                this.contractAddress,
                NFT_MINTER_ABI,
                'getTokenNameFromId',
                [tokenId]
              ) as string;
              
              logger.info(`📛 Token ${tokenId} name from contract: "${tokenName}"`);
              
              if (tokenName && tokenName.trim() && tokenName !== '' && tokenName !== '0x' && tokenName !== '0') {
                domainName = tokenName.trim();
                logger.info(`✅ Using domain name from contract: ${domainName}`);
              } else {
                logger.warn(`⚠️ Empty or invalid token name for token ${tokenId}: "${tokenName}"`);
              }
            } catch (nameError) {
              logger.warn(`Could not get token name for token ID ${tokenId}:`, nameError);
            }

            // Try to get metadata URI for additional info
            try {
              metadataUri = await WalletService.readContract(
                this.contractAddress,
                NFT_MINTER_ABI,
                'uri',
                [tokenId]
              ) as string;
              
              if (metadataUri) {
                logger.info(`🔗 Token ${tokenId} metadata URI: ${metadataUri}`);
              }
            } catch (uriError) {
              logger.warn(`Could not get URI for token ${tokenId}:`, uriError);
            }

            nfts.push({
              tokenId: tokenId.toString(),
              balance: balance.toString(),
              domainName,
              title: domainName.startsWith('Domain #') ? `Domain NFT #${tokenId}` : domainName,
              description: `NFT representing ownership rights for ${domainName}`,
              image: metadataUri || "" // Use metadata URI if available
            });
          }
        } catch (error) {
          // If there's an error checking a specific token ID, log it but continue
          logger.warn(`Failed to check token ID ${tokenId} for ${ownerAddress}:`, error);
        }
      }

      logger.info(`✅ Found ${nfts.length} NFTs for address: ${ownerAddress}`);
      return nfts;
    } catch (error) {
      logger.error(`❌ Failed to fetch NFTs for ${ownerAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get domain name from token ID using the mapping
   * @param tokenId The token ID
   * @returns The domain name hash (we'll need to implement reverse lookup)
   */
  static async getDomainNameFromTokenId(tokenId: bigint): Promise<string> {
    try {
      const domainNameHash = await WalletService.readContract(
        this.contractAddress,
        NFT_MINTER_ABI,
        's_tokenIdToDomainName',
        [tokenId]
      ) as Hex;

      // TODO: Implement proper domain name reverse lookup
      // For now, return a placeholder
      return `Domain #${tokenId}`;
    } catch (error) {
      logger.error(`❌ Failed to get domain name for token ID ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Get the contract ABI
   */
  static getContractABI() {
    return NFT_MINTER_ABI;
  }
} 