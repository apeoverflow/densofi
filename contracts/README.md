# Contracts

Smart contracts demonstrating cross-chain messaging on the Superchain using [interoperability](https://specs.optimism.io/interop/overview.html).

## Contracts

### [DensofiLaunchpad.sol](./src/DensofiLaunchpad.sol)

- Main launchpad contract for token creation and liquidity management
- Integrates with Uniswap V3 for real liquidity pools
- Uses Pyth Oracle for price feeds
- Supports fake pool mechanism for initial trading

### [DomainRegistration.sol](./src/DomainRegistration.sol)

- Handles domain name registration functionality
- Configurable registration fees per chain
- Ownable for administrative control

### [NFTMinter.sol](./src/NFTMinter.sol)

- ERC1155 contract for minting domain-based NFTs
- Integrates with domain registration system
- Supports metadata storage for domains

### [TokenMinter.sol](./src/TokenMinter.sol)

- Creates Superchain ERC20 tokens from NFTs
- Can send tokens directly to users or to launchpad
- Configurable fees and launchpad integration

### [InitialSupplySuperchainERC20.sol](./src/InitialSupplySuperchainERC20.sol)

- Extends [SuperchainERC20](https://github.com/ethereum-optimism/interop-lib/blob/main/src/SuperchainERC20.sol) for cross-chain token functionality (implements [ERC-7802](https://github.com/ethereum-optimism/interop-lib/blob/main/src/interfaces/IERC7802.sol))
- Includes configurable name, symbol, and decimals
- Ownable for administrative control
- Mints initial supply only on specified chain ID, supply is minted to the owner

## Development

### Dependencies

```bash
forge install
```

### Build

```bash
forge build
```

### Test

```bash
forge test
```

### Deploy

The deployment script automatically configures contracts for the target chain using chain-specific parameters.

#### Supported Chains

- Ethereum Mainnet (1)
- Sepolia Testnet (11155111)
- Polygon Mainnet (137)
- Arbitrum One (42161)
- Optimism (10)
- Base (8453)
- Base Sepolia (84532)
- Flow Mainnet (747) - *Uses PunchSwap V3*

#### Check chain configuration before deployment:

```bash
# Show config for current chain (based on RPC)
forge script script/ShowChainConfig.s.sol --rpc-url $RPC_URL

# Example output shows all parameters that will be used
```

#### Deploy to a specific chain:

```bash
# Set your private key
export PRIVATE_KEY=your_private_key_here

# Deploy to Sepolia
forge script script/DeployContracts.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify

# Deploy to Base
forge script script/DeployContracts.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify

# Deploy to any supported chain
forge script script/DeployContracts.s.sol --rpc-url $RPC_URL --broadcast
```

#### Chain Configuration

The deployment script uses `ChainConfig.sol` to automatically configure:

- Domain registration fees (varies by chain)
- Uniswap V3 contract addresses
- WETH/native token addresses
- Pyth Oracle addresses and price feed IDs
- TokenMinter fixed fees

#### Deployment Addresses

After deployment, addresses are automatically saved to:
```
deployment-addresses/{chainId}-addresses.json
```

Example output:
```json
{
  "chainId": 11155111,
  "deployer": "0x...",
  "addresses": {
    "domainRegistration": "0x...",
    "nftMinter": "0x...",
    "tokenMinter": "0x...",
    "launchpad": "0x..."
  },
  "parameters": {
    "domainRegistrationFee": "1000000000000000",
    "uniV3Router": "0x...",
    ...
  }
}
```

## Testing

Tests are in `test/` directory:

- Unit tests for both contracts
- Uses Foundry's cheatcodes for chain simulation

```bash
forge test
```

## License

MIT
