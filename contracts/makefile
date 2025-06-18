-include .env

.PHONY: help deploy-sepolia deploy-flow verify-sepolia verify-flow test test-launchpad-fork test-launchpad-flow-fork clean get-address show-config-sepolia show-config-flow

help:
	@echo "Available commands:"
	@echo "  make deploy-sepolia   - Deploy contracts to Sepolia testnet"
	@echo "  make deploy-flow      - Deploy contracts to Flow mainnet"
	@echo "  make deploy-flow-simple - Deploy to Flow using simplified script (recommended)"
	@echo "  make verify-sepolia   - Verify contracts on Sepolia after deployment"
	@echo "  make verify-flow      - Verify contracts on Flow after deployment"
	@echo "  make show-config-sepolia - Show Sepolia configuration before deployment"
	@echo "  make show-config-flow    - Show Flow configuration before deployment"
	@echo "  make test            - Run forge tests"
	@echo "  make test-launchpad-fork - Run DensoFi Launchpad tests with mainnet fork"
	@echo "  make test-launchpad-flow-fork - Run DensoFi Launchpad tests with Flow fork"
	@echo "  make get-address     - Get your wallet address from private key"
	@echo "  make clean           - Clean build artifacts"

# Check if required environment variables are set
check-env:
	@if [ -z "$(PRIVATE_KEY)" ]; then \
		echo "Error: PRIVATE_KEY is not set. Add it to .env file or export it."; \
		exit 1; \
	fi

check-env-sepolia: check-env
	@if [ -z "$(SEPOLIA_RPC_URL)" ]; then \
		echo "Error: SEPOLIA_RPC_URL is not set. Add it to .env file or export it."; \
		echo "Example: SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-api-key"; \
		exit 1; \
	fi

check-env-flow: check-env
	@if [ -z "$(FLOW_RPC_URL)" ]; then \
		echo "Error: FLOW_RPC_URL is not set. Add it to .env file or export it."; \
		echo "Example: FLOW_RPC_URL=https://mainnet.evm.nodes.onflow.org"; \
		exit 1; \
	fi

# Show configuration before deployment
show-config-sepolia: check-env-sepolia
	@echo "Showing Sepolia configuration..."
	@forge script script/ShowChainConfig.s.sol --rpc-url $(SEPOLIA_RPC_URL)

show-config-flow: check-env-flow
	@echo "Showing Flow configuration..."
	@forge script script/ShowChainConfig.s.sol --rpc-url $(FLOW_RPC_URL)

# Deploy to Sepolia
deploy-sepolia: check-env-sepolia
	@echo "Deploying to Sepolia..."
	@mkdir -p deployment-addresses
	@forge script script/DeployContracts.s.sol --rpc-url $(SEPOLIA_RPC_URL) --broadcast -vvv
	@echo "Deployment complete. Addresses saved to deployment-addresses/11155111-addresses.json"

# Deploy to Flow
deploy-flow: check-env-flow
	@echo "Deploying to Flow..."
	@mkdir -p deployment-addresses
	@forge script script/DeployContracts.s.sol --rpc-url $(FLOW_RPC_URL) --broadcast --legacy -vvv
	@echo "Deployment complete. Addresses saved to deployment-addresses/747-addresses.json"

# Verify contracts on Sepolia
verify-sepolia: check-env-sepolia
	@if [ -z "$(ETHERSCAN_API_KEY)" ]; then \
		echo "Error: ETHERSCAN_API_KEY is not set for verification"; \
		exit 1; \
	fi
	@if [ ! -f "deployment-addresses/11155111-addresses.json" ]; then \
		echo "Error: Deployment addresses file not found. Deploy first with 'make deploy-sepolia'"; \
		exit 1; \
	fi
	@echo "Verifying contracts on Sepolia..."
	@forge script script/DeployContracts.s.sol --rpc-url $(SEPOLIA_RPC_URL) --verify --etherscan-api-key $(ETHERSCAN_API_KEY)

# Verify contracts on Flow
verify-flow: check-env-flow
	@if [ ! -f "deployment-addresses/747-addresses.json" ]; then \
		echo "Error: Deployment addresses file not found. Deploy first with 'make deploy-flow'"; \
		exit 1; \
	fi
	@echo "Verifying contracts on Flow using Blockscout..."
	@echo "Reading deployment addresses from deployment-addresses/747-addresses.json"
	@echo ""
	@echo "Verifying DomainRegistration contract..."
	@forge verify-contract \
		--rpc-url https://mainnet.evm.nodes.onflow.org/ \
		--verifier blockscout \
		--verifier-url 'https://evm.flowscan.io/api/' \
		$$(cat deployment-addresses/747-addresses.json | jq -r '.addresses.domainRegistration') \
		src/DomainRegistration.sol:DomainRegistration
	@echo ""
	@echo "Verifying NFTMinter contract..."
	@forge verify-contract \
		--rpc-url https://mainnet.evm.nodes.onflow.org/ \
		--verifier blockscout \
		--verifier-url 'https://evm.flowscan.io/api/' \
		$$(cat deployment-addresses/747-addresses.json | jq -r '.addresses.nftMinter') \
		src/NFTMinter.sol:NFTMinter
	@echo ""
	@echo "Verifying TokenMinter contract..."
	@forge verify-contract \
		--rpc-url https://mainnet.evm.nodes.onflow.org/ \
		--verifier blockscout \
		--verifier-url 'https://evm.flowscan.io/api/' \
		$$(cat deployment-addresses/747-addresses.json | jq -r '.addresses.tokenMinter') \
		src/TokenMinter.sol:TokenMinter
	@echo ""
	@echo "Verifying DensoFiLaunchpad contract..."
	@forge verify-contract \
		--rpc-url https://mainnet.evm.nodes.onflow.org/ \
		--verifier blockscout \
		--verifier-url 'https://evm.flowscan.io/api/' \
		$$(cat deployment-addresses/747-addresses.json | jq -r '.addresses.launchpad') \
		src/DensofiLaunchpad.sol:DensoFiLaunchpad
	@echo ""
	@echo "All contracts verified on Flow!"

# Run tests
test:
	@echo "Running tests..."
	@$(MAKE) test-no-fork
	@$(MAKE) test-launchpad-fork

test-no-fork:
	@echo "Running tests..."
	@forge test -vv

# Run DensoFi Launchpad tests with mainnet fork
test-launchpad-fork:
	@echo "Running DensoFi Launchpad tests with mainnet fork..."
	@forge test --match-contract DensoFiLaunchpadTest --fork-url https://eth-mainnet.public.blastapi.io -vv

# Run DensoFi Launchpad tests with Flow fork
test-launchpad-flow-fork: check-env-flow
	@echo "Running DensoFi Launchpad tests with Flow fork..."
	@forge test --match-contract DensoFiLaunchpadTest --fork-url $(FLOW_RPC_URL) -vv

get-address: check-env
	@echo "Your public address is:"
	@cast wallet address --private-key $(PRIVATE_KEY)

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@forge clean