# Densofi 

🌐 **Live Demo:** https://densofi.vercel.app/

## Overview

Domain names are a growing $2.4 Billion dollar RWA (Real World Asset) market, but they lack price discovery, liquidity, and transparency due to entrenched players like GoDaddy.

**Densofi solves this** by bringing traditional domain names onchain through fractional tokenization, unlocking:
- ✅ **Price Discovery** - Real-time market valuation
- ✅ **Liquidity** - Upfront and partial liquidity provisioning  
- ✅ **Democratized Access** - Allow more people to participate in domain upside
- ✅ **Cross-chain Functionality** - Built on Superchain technology

## Architecture

### Technical Flow

1. **Domain Verification** - Users verify ownership using DNS TXT records
2. **NFT Minting** - Domain ownership is represented as ERC1155 NFTs
3. **Token Creation** - Domain NFTs can be converted to Superchain ERC20 tokens (1M supply)
4. **Launchpad Mechanics** - Tokens use bonding curve pricing until market cap threshold
5. **Uniswap V3 Launch** - Upon reaching threshold, liquidity is deployed to Uniswap V3
6. **Fee Collection** - Domain owners collect trading fees through dedicated vaults
7. **Subdomain Rights** - Token holders with 5%+ can register valuable subdomains

### Smart Contract Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ DomainRegistration │──→│   NFTMinter      │──→│  TokenMinter    │
│  - Fee collection  │    │  - ERC1155 NFTs  │    │ - Superchain    │
│  - Admin controls  │    │  - Domain mapping│    │   ERC20 tokens  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
                                                          ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ DensoFiUniV3Vault│◄───│ DensoFiLaunchpad │◄───│                 │
│ - Fee collection │    │ - Bonding curve  │    │                 │
│ - Ownership mgmt │    │ - Market cap     │    │                 │
└─────────────────┘    │ - Uniswap launch │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## Deployments

### Current Network Support

| Network | Chain ID | Status | Explorer |
|---------|----------|--------|----------|
| **Flow Mainnet** | 747 | ✅ Live | [flowscan.io](https://flowscan.io) |
| **Ethereum Sepolia** | 11155111 | ✅ Live | [sepolia.etherscan.io](https://sepolia.etherscan.io) |
| **World Chain Sepolia** | - | ✅ Live | [worldchain-sepolia.g.alchemy.com](https://worldchain-sepolia.g.alchemy.com) |

### Contract Addresses

#### Flow Mainnet (Chain ID: 747)
```
Deployer:            0x9b8A91c271B230e8647F01cA9d31e28b79f6d6AA
DomainRegistration:  0xf5418837202c5970eefcf7415Dd0ae17c64F8C01
NFTMinter:           0xC179eD1e83872ea68Dd7308E96C052f8d4088972
TokenMinter:         0x2af0a540846e0E427C3eeBF035Bf02C37bf8a6ab
Launchpad:           0x8a6c3E1aF65E2831B37923b0e9B878d229B1B1B5
```

#### Ethereum Sepolia (Chain ID: 11155111)
```
Deployer:            0x9b8A91c271B230e8647F01cA9d31e28b79f6d6AA
DomainRegistration:  0xA6f09EB11F5eDEE3ed04cA213a33e5b362fC8c5B
NFTMinter:           0xB41920fD5d6AFDcFBf648F8E2A1CB6376EF0EFA0
TokenMinter:         0xF2029e8B4d5EA818789D2Ab13bfaF0CD48a9D160
Launchpad:           0x9AFDC6EcC6DB0176102f9E7EAA104E899b2Dc833
```

## Usage Flow

### For Domain Owners

1. **Register Domain**
   ```solidity
   // Pay registration fee to verify domain ownership
   domainRegistration.requestRegistration{value: fee}("example.com");
   ```

2. **Mint Domain NFT**
   ```solidity
   // After admin verification, mint NFT representing domain
   nftMinter.mintDomainNFT("example.com");
   ```

3. **Create Token**
   ```solidity
   // Convert NFT to 1M ERC20 tokens
   tokenMinter.createTokenFromNFT(tokenId, false); // false = send to launchpad
   ```

4. **Launch on Uniswap**
   ```solidity
   // After market cap threshold reached
   launchpad.launchToken(tokenAddress);
   ```

### For Traders/Speculators

1. **Buy Tokens** (Bonding Curve Phase)
   ```solidity
   // Buy tokens at current bonding curve price
   launchpad.buyTokens{value: ethAmount}(tokenAddress, minTokensOut);
   ```

2. **Sell Tokens**
   ```solidity
   // Sell tokens back to bonding curve (subject to sell penalty)
   token.approve(address(launchpad), tokenAmount);
   launchpad.sellTokens(tokenAddress, tokenAmount, minEthOut);
   ```

3. **Trade on Uniswap** (Post-Launch)
   ```solidity
   // Once launched, tokens trade on Uniswap V3
   // Standard DEX trading applies
   ```

## Development Setup

### Prerequisites

- Node.js 18+
- Foundry (for smart contracts)
- Git

### Smart Contracts

```bash
# Clone repository
git clone https://github.com/your-org/densofi.git
cd densofi

# Install contract dependencies
cd contracts
forge install

# Run tests
forge test -vv

# Deploy to local network
anvil # in separate terminal
forge script script/DeployContracts.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Frontend

```bash
# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

### Environment Variables

Create `.env` in the contracts directory:

```bash
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
FLOW_RPC_URL=https://mainnet.evm.nodes.onflow.org
ETHERSCAN_API_KEY=your_etherscan_key
```

## Testing

### Smart Contract Tests

```bash
cd contracts

# Run all tests
forge test

# Run specific test file
forge test --match-contract DensoFiLaunchpadTest

# Run with verbose output
forge test -vv

# Run fork tests (requires RPC URL)
forge test --fork-url $SEPOLIA_RPC_URL
```

### Test Coverage

```bash
# Generate coverage report
forge coverage

# Generate detailed HTML report
forge coverage --report lcov
genhtml lcov.info -o coverage/
```

## Key Features

### 🔄 Bonding Curve Mechanics
- **Dynamic Pricing** - Token price increases with each purchase
- **Market Cap Threshold** - $75,000 USD triggers Uniswap launch
- **Sell Penalty** - Configurable penalty (0-10%) to discourage dumping

### 🏦 Fee Structure
- **Creation Fee** - $1 USD equivalent to create tokens
- **Transaction Fee** - 1% on all trades
- **Launch Fee** - 3% when moving to Uniswap
- **Trading Fees** - 0.3% Uniswap V3 fees collected by domain owners

### 🔗 Cross-Chain Support
- **Superchain ERC20** - Native cross-chain token standard
- **Multi-Chain Deployment** - Ethereum, Flow, World Chain support
- **Unified Liquidity** - Cross-chain composability

### 🛡️ Security Features
- **Domain Verification** - DNS TXT record validation
- **Admin Controls** - Multi-sig compatible ownership
- **Emergency Functions** - Pause and withdraw capabilities
- **Comprehensive Testing** - 95%+ test coverage

## Roadmap

### Phase 1 ✅ (Current)
- [x] Core smart contracts
- [x] Multi-chain deployment
- [x] Basic frontend
- [x] Domain verification system

### Phase 2 🚧 (In Progress)
- [ ] ENS integration for Ethereum
- [ ] Advanced trading interface
- [ ] Analytics dashboard
- [ ] Mobile app

### Phase 3 📋 (Planned)
- [ ] Subdomain marketplace
- [ ] Governance token
- [ ] DAO structure
- [ ] Additional chain support

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

📧 **Email:** chimera_defi@protonmail.com  
🌐 **Website:** https://densofi.vercel.app  
🐦 **Twitter:** [@DensoFi](https://twitter.com/DensoFi)  
💬 **Discord:** [Join our community](https://discord.gg/densofi)

---

*Built with ❤️ for the decentralized web*