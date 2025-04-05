# Densofi - ETHGlobal Taipei 2025

https://densofi.vercel.app/

Domain names are a growing $2.4 Billion dollar RWA market.  
But they lack price discovery, liquidity and transparency.  
Due to entrenched players like GoDaddy.  

Densofi solves this.  
By bringing tradition domain names onchain and using fractional tokenization. 
We unlock price discovery. 
Upfront and partial liquidity provisioning. 
Allow more people to participate in the upside.  

# Overview Technical 

- 1. Users verify ownership of domain using dns txt record 
- 2a. Chains w/ ENS use the ENS resolver to verify ownership and mint tokens 
- 2b. Chains without ENS directly mint a ERC1155 NFT via permissioned minter after offchain verification
- 3. A <Domain name> Token Superchain ERC20 is minted to the user. Allowing cross chain functionality across the super chain defi eco. 
- 4. Utilizing launchpad like mechanics, a liquidity pool is created from this token against a stable-coin or crypto pair. 
- 5. Speculators, traders, supporters can purchase from or add to this LP to help price discovery and participate in upside. (e.g. purchase shares of jordan.com) 
- 6. Additional utility is unlocked by allowing users that purchase 5% of tokens, a lock mechanism that enables them to register valuable subdomains against SEO friendly or high potential domains. (e.g. stables.newswap.org)
7. At the end of the lease term, the token is released back to the user and TLD/ICANN if not renewed. 

# Deployments:

- Flow mainnet and testnet
- Worldchain sepolia testnet + world chain minikit app 
- Ethereum sepolia testnet 


# Contact: chimera_defi@protonmail.com

## Deployments 
deployer: 0xA120FAd0498ECbF755a675E3833158484123bF30
```
sepolia
tokenminter 0x50e2744ec42865918f9f3657a39d4421639d0177
nftminter 0x338e3e152689E5Ab9cc66538D7A2F3785C30ee25

world-sepolia  
0x338e3e152689E5Ab9cc66538D7A2F3785C30ee25
0xe752a5328bccb439d77672feb8c19b117a4f193a

flow testnet evm
0x50E2744ec42865918F9f3657a39D4421639D0177
  NFTMinter deployed to:  0x338e3e152689E5Ab9cc66538D7A2F3785C30ee25
  TokenMinter deployed to:  0x50E2744ec42865918F9f3657a39D4421639D0177

flow mainnet

  NFTMinter already deployed at 0x338e3e152689E5Ab9cc66538D7A2F3785C30ee25 on chain id: 747
  Deployed TokenMinter at address: 0x50E2744ec42865918F9f3657a39D4421639D0177 on chain id: 747
```

## Flow: (nnot the chain)
```
// 1. Deploy contracts
NFTMinter nftMinter = new NFTMinter();
TokenMinter tokenMinter = new TokenMinter(address(nftMinter));

// 2. Mint an NFT
nftMinter.mint("website.tld", 1);
// Assume the token ID is 0

// 3. Create a token from the NFT
tokenMinter.createTokenFromNFT(0);
// This transfers the NFT to the token minter contract
// and creates a new ERC20 token

// 4. Get the token address
address tokenAddress = tokenMinter.getTokenAddress(0);

// 5. Use the token
IERC20 token = IERC20(tokenAddress);
// You now have 1 million tokens
```

deploy - note the addr 0xf39 is the default anvil address acc 1. 
```
may need to run `pnpm run dev` first

forge script script/DeployNFTTokenMinter.s.sol:DeployNFTTokenMinter --rpc-url http://localhost:8545 --broadcast -vvvv
    export FOUNDRY_PRIVATE_KEY=<pk>
    forge script script/DeployNFTTokenMinter.s.sol:DeployNFTTokenMinter \
      --rpc-url $RPC \
      --broadcast \
      --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
      -vvvv
  
export RPC=http://localhost:9545 && !! 

export RPC="https://testnet.evm.nodes.onflow.org/"
export RPC="https://alfajores-forno.celo-testnet.org/"
export RPC="worldchain-sepolia.g.alchemy.com/public"
```
