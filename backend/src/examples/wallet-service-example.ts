import { WalletService } from '../services/wallet-service.js';
import { NFTMinterService } from '../services/nft-minter-service.js';
import { formatEther } from 'viem';
import { logger } from '../utils/logger.js';

/**
 * Example demonstrating how to use the WalletService and NFTMinterService
 * to interact with smart contracts
 */
async function walletServiceExample() {
  try {
    logger.info('🚀 Starting Wallet Service Example\n');

    // 1. Initialize the wallet service
    logger.info('📌 Step 1: Initialize Wallet Service');
    await WalletService.initialize();
    
    // 2. Check account balance
    logger.info('\n📌 Step 2: Check Account Balance');
    const balance = await WalletService.getBalance();
    logger.info(`💰 Account balance: ${formatEther(balance)} ETH`);

    // 3. Initialize NFTMinter service
    logger.info('\n📌 Step 3: Initialize NFTMinter Service');
    await NFTMinterService.initialize();

    // 4. Example domain name for testing
    const testDomain = 'a.com';
    const testOwner = WalletService.getAccount().address; // Use the address from WalletService

    // 5. Check if domain is currently mintable
    logger.info('\n📌 Step 4: Check Domain Mintable Status');
    try {
      const isMintable = await NFTMinterService.isDomainMintable(testDomain);
      logger.info(`🔍 Domain ${testDomain} is mintable: ${isMintable}`);
    } catch (error: any) {
      logger.warn(`⚠️  Could not check mintable status (domain may not exist): ${error.message || error}`);
      if (error.cause) {
        logger.warn(`   Error Cause: ${error.cause}`);
      }
      // Log other potentially useful properties, viem errors can be nested
      // Safely stringify the error, handling circular references and BigInts
      const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key: string, value: any) => {
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return "[Circular]";
            }
            seen.add(value);
          }
          if (typeof value === 'bigint') {
            return value.toString() + 'n'; // Convert BigInt to string
          }
          return value;
        };
      };
      try {
        logger.warn(`   Full Error Object: ${JSON.stringify(error, getCircularReplacer())}`);
      } catch (e) {
        logger.warn(`   Could not stringify full error object: ${e}`);
        // Fallback for very complex errors, just log specific known viem properties
        if (error.shortMessage) logger.warn(`   Short Message: ${error.shortMessage}`);
        if (error.metaMessages) logger.warn(`   Meta Messages: ${JSON.stringify(error.metaMessages)}`);
        if (error.details) logger.warn(`   Details: ${error.details}`);
      }
    }

    // 6. Set domain owner (admin function)
    logger.info('\n📌 Step 5: Set Domain Owner');
    try {
      const setOwnerTx = await NFTMinterService.setDomainOwner(testDomain, testOwner);
      logger.info(`✅ Set domain owner transaction: ${setOwnerTx}`);
      
      // Wait for confirmation
      await WalletService.waitForTransactionReceipt(setOwnerTx);
    } catch (error) {
      logger.error(`❌ Failed to set domain owner: ${error}`);
    }

    // 7. Set domain as mintable (admin function)
    logger.info('\n📌 Step 6: Set Domain as Mintable');
    try {
      const setMintableTx = await NFTMinterService.setDomainMintable(testDomain, true);
      logger.info(`✅ Set domain mintable transaction: ${setMintableTx}`);
      
      // Wait for confirmation
      await WalletService.waitForTransactionReceipt(setMintableTx);
    } catch (error) {
      logger.error(`❌ Failed to set domain mintable: ${error}`);
    }

    // 8. Verify the changes
    logger.info('\n📌 Step 7: Verify Changes');
    try {
      const domainOwner = await NFTMinterService.getDomainOwner(testDomain);
      const isMintable = await NFTMinterService.isDomainMintable(testDomain);
      
      logger.info(`👤 Domain owner: ${domainOwner}`);
      logger.info(`🎯 Domain is mintable: ${isMintable}`);
    } catch (error) {
      logger.error(`❌ Failed to verify changes: ${error}`);
    }

    // 9. Process a complete domain registration (both owner and mintable in sequence)
    logger.info('\n📌 Step 8: Process Complete Domain Registration');
    const newDomain = 'another-example.com';
    try {
      const result = await NFTMinterService.processDomainRegistration(newDomain, testOwner);
      logger.info(`✅ Complete domain registration processed:`);
      logger.info(`   Set Owner Tx: ${result.setOwnerTx}`);
      logger.info(`   Set Mintable Tx: ${result.setMintableTx}`);
    } catch (error) {
      logger.error(`❌ Failed to process domain registration: ${error}`);
    }

    logger.info('\n🎉 Wallet Service Example completed successfully!');

  } catch (error) {
    logger.error('❌ Wallet Service Example failed:', error);
    process.exit(1);
  }
}

/**
 * Example showing advanced wallet operations
 */
async function advancedWalletExample() {
  try {
    logger.info('\n🔥 Advanced Wallet Operations Example\n');

    // Initialize services
    await WalletService.initialize();
    await NFTMinterService.initialize();

    // Get account info
    const account = WalletService.getAccount();
    const balance = await WalletService.getBalance();
    const nonce = await WalletService.getTransactionCount();

    logger.info('📊 Account Information:');
    logger.info(`   Address: ${account.address}`);
    logger.info(`   Balance: ${formatEther(balance)} ETH`);
    logger.info(`   Nonce: ${nonce}`);

    // Example of reading contract data
    logger.info('\n📖 Reading Contract Data:');
    const contractAddress = NFTMinterService.getContractAddress();
    logger.info(`   Contract Address: ${contractAddress}`);

    // Example of simulating a contract call before executing
    logger.info('\n🧪 Simulating Contract Call:');
    try {
      const simulation = await WalletService.simulateContract(
        contractAddress,
        NFTMinterService.getContractABI(),
        'isDomainMintable',
        ['test-domain.com']
      );
      logger.info(`   Simulation result: ${simulation.result}`);
    } catch (error) {
      logger.warn(`   Simulation failed (expected for non-existent domain): ${error}`);
    }

  } catch (error) {
    logger.error('❌ Advanced example failed:', error);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await walletServiceExample();
    // await advancedWalletExample();
    process.exit(0);
  })();
}

export { walletServiceExample }; 