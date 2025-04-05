# Contracts

Smart contracts demonstrating cross-chain messaging on the Superchain using [interoperability](https://specs.optimism.io/interop/overview.html).

## Contracts

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

Deploy to multiple chains using either:

1. Super CLI (recommended):

```bash
cd ../ && pnpm sup
```

2. Direct Forge script:

```bash
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
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


# Deploy Script

Address is the NameWrapper on Sepolia

```
forge create --rpc-url "https://ethereum-sepolia-rpc.publicnode.com" \
    --broadcast
    --private-key <your_private_key> \
    --etherscan-api-key "KH2SPPRHM1F1MD5WQ4SSTF7BB9ZBBVIE8G" \
    --verify \
    src/TokenMinter.sol:TokenMinter
```

Deployed to 0xc3867159d9D75b2330240106c8e54Ce097d09366