import { WalletService } from '../services/wallet-service.js';
import { formatEther, type Abi } from 'viem';
import { logger } from '../utils/logger.js';

// ERC-20 ABI for common functions (name, symbol, totalSupply, balanceOf)
const ERC20_ABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  } as const,
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  } as const,
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  } as const,
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  } as const
] as const;

/**
 * Example demonstrating ERC20 token interactions using WalletService
 */
async function erc20Example() {
  try {
    logger.info(`\n📊 Starting ERC20 Example\n`);

    // 1. Initialize the wallet service
    logger.info('📌 Step 1: Initialize Wallet Service');
    await WalletService.initialize();

    const erc20ContractAddress = '0xa3c6530dfeabc1de3c97549e318054c871e5d0bc'; // Example ERC20 token on Sepolia (replace if needed)
    const walletAccountAddress = WalletService.getAccount().address;

    logger.info(`\n📌 Step 2: Reading ERC20 Token Information for ${erc20ContractAddress}`);

    // Get token name
    const tokenName = await WalletService.readContract(
      erc20ContractAddress,
      ERC20_ABI as Abi,
      'name'
    );
    logger.info(`   Token Name: ${tokenName}`);

    // Get token symbol
    const tokenSymbol = await WalletService.readContract(
      erc20ContractAddress,
      ERC20_ABI as Abi,
      'symbol'
    );
    logger.info(`   Token Symbol: ${tokenSymbol}`);

    // Get total supply
    const totalSupply = await WalletService.readContract(
      erc20ContractAddress,
      ERC20_ABI as Abi,
      'totalSupply'
    );
    logger.info(`   Total Supply: ${totalSupply}`);

    // Get wallet's balance of this ERC20 token
    logger.info(`\n📌 Step 3: Get Wallet's ERC20 Balance for ${walletAccountAddress}`);
    const tokenBalance = await WalletService.readContract(
      erc20ContractAddress,
      ERC20_ABI as Abi,
      'balanceOf',
      [walletAccountAddress]
    );
    logger.info(`   Wallet's Token Balance: ${tokenBalance}`);

    // Get ETH balance of the wallet
    logger.info(`\n📌 Step 4: Get Wallet's ETH Balance`);
    const ethBalance = await WalletService.getBalance();
    logger.info(`   Wallet's ETH Balance: ${formatEther(ethBalance)} ETH`);

    logger.info(`\n🎉 ERC20 Example completed successfully!`);

  } catch (error) {
    logger.error('❌ ERC20 Example failed:', error);
    process.exit(1);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    await erc20Example();
    process.exit(0);
  })();
}

export { erc20Example }; 