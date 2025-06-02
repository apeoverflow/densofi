# Wallet and Smart Contract Services

This directory contains services for interacting with smart contracts using viem, a TypeScript interface for Ethereum. The services are designed to be composable and allow you to call admin-only functions on smart contracts.

## Services Overview

### 1. WalletService (`wallet-service.ts`)

A foundational service that provides wallet connection and basic contract interaction capabilities.

**Features:**
- Creates wallet client using private key from environment variables
- Provides methods for reading, writing, and simulating contract calls
- Handles transaction confirmation and receipt waiting
- Supports account balance and nonce management

**Key Methods:**
- `initialize()` - Initialize the wallet service with private key from ENV.PRIVATE_KEY
- `writeContract()` - Execute a contract function (with simulation first)
- `readContract()` - Read from a contract (no gas required)
- `simulateContract()` - Simulate a contract call before execution
- `waitForTransactionReceipt()` - Wait for transaction confirmation
- `getBalance()` - Get account balance
- `getTransactionCount()` - Get account nonce

### 2. NFTMinterService (`nft-minter-service.ts`)

A specialized service for interacting with the NFTMinter contract, built on top of WalletService.

**Features:**
- Provides methods specific to the NFTMinter contract
- Includes ABI definitions for the contract functions
- Supports setting domain mintable status and ownership
- Combines multiple operations into single workflows

**Key Methods:**
- `initialize()` - Initialize using contract address from ENV.DOMAIN_REGISTRATION_CONTRACT
- `setDomainMintable()` - Set a domain as mintable (admin only)
- `setDomainOwner()` - Set the owner of a domain (admin only)
- `isDomainMintable()` - Check if a domain is mintable
- `getDomainOwner()` - Get the owner of a domain
- `getTokenIdForDomain()` - Get token ID for a domain
- `processDomainRegistration()` - Complete workflow: set owner + set mintable

## Setup and Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Required: Private key for the admin wallet
PRIVATE_KEY=0x1234567890abcdef...

# Required: RPC URL for blockchain connection
RPC_URL=https://rpc2.sepolia.org

# Required: Contract address for the NFTMinter contract
DOMAIN_REGISTRATION_CONTRACT=0x640b66a1cd9D2e3c4F118B9Bb58479c0Ca439f42

# Optional: Chain ID (defaults to Sepolia)
CHAIN_ID=11155111
```

### Installation

The services use viem for blockchain interactions:

```bash
npm install viem
```

## Usage Examples

### Basic Wallet Service Usage

```typescript
import { WalletService } from './services/wallet-service.js';

// Initialize the wallet service
await WalletService.initialize();

// Check account balance
const balance = await WalletService.getBalance();
console.log(`Balance: ${formatEther(balance)} ETH`);

// Read from a contract
const result = await WalletService.readContract(
  contractAddress,
  abi,
  'functionName',
  [arg1, arg2]
);

// Write to a contract (with automatic simulation)
const txHash = await WalletService.writeContract(
  contractAddress,
  abi,
  'functionName',
  [arg1, arg2]
);

// Wait for confirmation
const receipt = await WalletService.waitForTransactionReceipt(txHash);
```

### NFTMinter Service Usage

```typescript
import { NFTMinterService } from './services/nft-minter-service.js';

// Initialize the service
await NFTMinterService.initialize();

// Set a domain as mintable
const txHash = await NFTMinterService.setDomainMintable('example.com', true);

// Set domain owner
const ownerTxHash = await NFTMinterService.setDomainOwner(
  'example.com',
  '0x742d35Cc6608C5c05a5b6C1e44Ab20C0F5C1D06E'
);

// Complete domain registration workflow
const result = await NFTMinterService.processDomainRegistration(
  'example.com',
  '0x742d35Cc6608C5c05a5b6C1e44Ab20C0F5C1D06E'
);
console.log(`Set Owner Tx: ${result.setOwnerTx}`);
console.log(`Set Mintable Tx: ${result.setMintableTx}`);

// Check domain status
const isMintable = await NFTMinterService.isDomainMintable('example.com');
const owner = await NFTMinterService.getDomainOwner('example.com');
```

### Integration with Domain Service

The `DomainService` has been updated to use these services in its `processPendingRegistrations()` method:

```typescript
import { DomainService } from './services/domain-service.js';

// Process pending registrations and set them as mintable
await DomainService.processPendingRegistrations();
```

This will:
1. Read pending registrations from the database
2. Store domain information in the database
3. Use NFTMinterService to set domain owner and mintable status on blockchain
4. Mark registrations as processed

## Contract Functions Supported

The NFTMinterService supports these NFTMinter contract functions:

- `setIsDomainMintable(string domainName, bool availableForNFTMinting)` - Set domain mintable status
- `setDomainNameToOwner(string domainName, address domainOwner)` - Set domain owner
- `isDomainMintable(string domainName) returns (bool)` - Check if domain is mintable
- `getDomainOwner(string domainName) returns (address)` - Get domain owner
- `getTokenIdForDomain(string domainName) returns (uint256)` - Get token ID for domain

## Error Handling

The services include comprehensive error handling:

- **Initialization errors**: Missing environment variables, invalid private keys
- **Network errors**: RPC connection issues, transaction failures
- **Contract errors**: Function reverts, invalid parameters
- **Transaction errors**: Insufficient gas, nonce issues

All errors are logged with descriptive messages and emojis for easy identification.

## Security Considerations

- **Private Key**: Store securely and never commit to version control
- **Admin Functions**: The services call admin-only functions - ensure proper access control
- **Gas Management**: Services automatically estimate gas but monitor for gas price fluctuations
- **Transaction Confirmation**: Always wait for transaction confirmation before proceeding

## Testing

Run the example file to test the services:

```bash
# Run the example (make sure to set environment variables first)
npm run dev -- src/examples/wallet-service-example.ts
```

The example demonstrates:
- Wallet initialization and balance checking
- Setting domain owners and mintable status
- Reading contract state
- Complete domain registration workflows
- Error handling scenarios

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   DomainService │    │  NFTMinterService │    │   WalletService │
│                 │    │                  │    │                 │
│ - Process       │───▶│ - Domain ops     │───▶│ - Contract calls│
│   registrations │    │ - ABI definitions│    │ - Wallet mgmt   │
│ - Database ops  │    │ - Admin functions│    │ - Transaction   │
└─────────────────┘    └──────────────────┘    │   handling      │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │      Viem       │
                                               │                 │
                                               │ - Ethereum      │
                                               │   interaction   │
                                               │ - Type safety   │
                                               └─────────────────┘
```

This modular architecture allows you to:
- Use WalletService for any contract interactions
- Use NFTMinterService for domain-specific operations
- Extend with additional contract-specific services
- Maintain clean separation of concerns 