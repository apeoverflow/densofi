import { createPublicClient, createWalletClient, http, type Address, type Hex, type WalletClient, type PublicClient, type Abi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class WalletService {
  private static walletClient: WalletClient | null = null;
  private static publicClient: PublicClient | null = null;
  private static account: any | null = null;

  /**
   * Initialize the wallet service with the private key from environment
   */
  static async initialize(): Promise<void> {
    try {
      if (!ENV.PRIVATE_KEY) {
        throw new Error('PRIVATE_KEY environment variable is required');
      }

      // Ensure private key has 0x prefix
      const privateKey = ENV.PRIVATE_KEY.startsWith('0x') 
        ? ENV.PRIVATE_KEY as Hex 
        : `0x${ENV.PRIVATE_KEY}` as Hex;

      // Create account from private key
      this.account = privateKeyToAccount(privateKey);
      
      // Create public client for reading contract state and simulating transactions
      this.publicClient = createPublicClient({
        chain: sepolia,
        transport: http(ENV.RPC_URL)
      });

      // Create wallet client for sending transactions
      this.walletClient = createWalletClient({
        account: this.account,
        chain: sepolia,
        transport: http(ENV.RPC_URL)
      });

      logger.info('✅ Wallet service initialized successfully');
      logger.info(`   Account: ${this.account.address}`);
    } catch (error) {
      logger.error('❌ Failed to initialize wallet service:', error);
      throw error;
    }
  }

  /**
   * Get the wallet client
   */
  static getWalletClient(): WalletClient {
    if (!this.walletClient) {
      throw new Error('Wallet service not initialized. Call WalletService.initialize() first.');
    }
    return this.walletClient;
  }

  /**
   * Get the public client
   */
  static getPublicClient(): PublicClient {
    if (!this.publicClient) {
      throw new Error('Wallet service not initialized. Call WalletService.initialize() first.');
    }
    return this.publicClient;
  }

  /**
   * Get the account
   */
  static getAccount() {
    if (!this.account) {
      throw new Error('Wallet service not initialized. Call WalletService.initialize() first.');
    }
    return this.account;
  }

  /**
   * Simulate a contract function call before executing it
   */
  static async simulateContract(
    contractAddress: Address,
    abi: Abi,
    functionName: string,
    args: any[] = []
  ): Promise<{ request: any; result: any }> {
    try {
      const publicClient = this.getPublicClient();
      const account = this.getAccount();

      const simulation = await publicClient.simulateContract({
        address: contractAddress,
        abi,
        functionName,
        args,
        account
      });

      return simulation;
    } catch (error) {
      logger.error(`❌ Contract simulation failed for ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Execute a contract function
   */
  static async writeContract(
    contractAddress: Address,
    abi: Abi,
    functionName: string,
    args: any[] = []
  ): Promise<Hex> {
    try {
      // First simulate the transaction
      const { request } = await this.simulateContract(contractAddress, abi, functionName, args);
      
      const walletClient = this.getWalletClient();
      
      // Execute the transaction
      const hash = await walletClient.writeContract(request);
      
      logger.info(`✅ Transaction sent: ${hash}`);
      logger.info(`   Function: ${functionName}`);
      logger.info(`   Contract: ${contractAddress}`);
      
      return hash;
    } catch (error) {
      logger.error(`❌ Contract write failed for ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Read from a contract (no gas required)
   */
  static async readContract(
    contractAddress: Address,
    abi: Abi,
    functionName: string,
    args: any[] = []
  ): Promise<any> {
    try {
      const publicClient = this.getPublicClient();

      const result = await publicClient.readContract({
        address: contractAddress,
        abi,
        functionName,
        args
      });

      return result;
    } catch (error) {
      logger.error(`❌ Contract read failed for ${functionName}:`, error);
      throw error;
    }
  }

  /**
   * Wait for a transaction to be confirmed
   */
  static async waitForTransactionReceipt(hash: Hex): Promise<any> {
    try {
      const publicClient = this.getPublicClient();
      
      logger.info(`⏳ Waiting for transaction confirmation: ${hash}`);
      
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        confirmations: 1
      });

      logger.info(`✅ Transaction confirmed: ${hash}`);
      logger.info(`   Block: ${receipt.blockNumber}`);
      logger.info(`   Gas used: ${receipt.gasUsed}`);

      return receipt;
    } catch (error) {
      logger.error(`❌ Failed to wait for transaction receipt:`, error);
      throw error;
    }
  }

  /**
   * Get the current account balance
   */
  static async getBalance(): Promise<bigint> {
    try {
      const publicClient = this.getPublicClient();
      const account = this.getAccount();

      const balance = await publicClient.getBalance({
        address: account.address
      });

      return balance;
    } catch (error) {
      logger.error('❌ Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Get transaction count (nonce) for the account
   */
  static async getTransactionCount(): Promise<number> {
    try {
      const publicClient = this.getPublicClient();
      const account = this.getAccount();

      const nonce = await publicClient.getTransactionCount({
        address: account.address
      });

      return nonce;
    } catch (error) {
      logger.error('❌ Failed to get transaction count:', error);
      throw error;
    }
  }
} 