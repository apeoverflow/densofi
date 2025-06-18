// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {ChainConfig} from "./ChainConfig.sol";

/**
 * @title ShowChainConfig
 * @notice Utility script to display chain configuration parameters
 * @dev Useful for checking deployment parameters before actual deployment
 */
contract ShowChainConfig is Script {
    function run() public view {
        uint256 chainId = block.chainid;

        console2.log("=== Chain Configuration for Chain ID:", chainId, "===");

        if (!ChainConfig.isChainSupported(chainId)) {
            console2.log(
                "WARNING: Chain ID",
                chainId,
                "is not explicitly supported."
            );
            console2.log(
                "Will use default configuration (Sepolia parameters)."
            );
        }

        ChainConfig.ChainParameters memory params = ChainConfig
            .getChainParameters(chainId);

        console2.log("\n--- Core Parameters ---");
        console2.log("Domain Registration Fee:", params.domainRegistrationFee);
        console2.log("TokenMinter Fixed Fee:", params.tokenMinterFixedFee);

        console2.log("\n--- Uniswap V3 Addresses ---");
        console2.log("Router:", params.uniV3Router);
        console2.log("Factory:", params.uniV3Factory);
        console2.log("Position Manager:", params.nonfungiblePositionManager);
        console2.log("WETH:", params.weth);

        console2.log("\n--- Oracle Configuration ---");
        console2.log("Pyth Oracle:", params.pythOracle);
        console2.log("ETH/USD Price ID:", vm.toString(params.ethUsdPriceId));

        console2.log("\n--- Supported Chains ---");
        uint256[] memory supportedChains = ChainConfig.getSupportedChains();
        for (uint256 i = 0; i < supportedChains.length; i++) {
            console2.log("Chain ID:", supportedChains[i]);
        }
    }

    function runForChain(uint256 targetChainId) public view {
        console2.log(
            "=== Chain Configuration for Chain ID:",
            targetChainId,
            "==="
        );

        if (!ChainConfig.isChainSupported(targetChainId)) {
            console2.log(
                "WARNING: Chain ID",
                targetChainId,
                "is not explicitly supported."
            );
            console2.log(
                "Will use default configuration (Sepolia parameters)."
            );
        }

        ChainConfig.ChainParameters memory params = ChainConfig
            .getChainParameters(targetChainId);

        console2.log("\n--- Core Parameters ---");
        console2.log("Domain Registration Fee:", params.domainRegistrationFee);
        console2.log("TokenMinter Fixed Fee:", params.tokenMinterFixedFee);

        console2.log("\n--- Uniswap V3 Addresses ---");
        console2.log("Router:", params.uniV3Router);
        console2.log("Factory:", params.uniV3Factory);
        console2.log("Position Manager:", params.nonfungiblePositionManager);
        console2.log("WETH:", params.weth);

        console2.log("\n--- Oracle Configuration ---");
        console2.log("Pyth Oracle:", params.pythOracle);
        console2.log("ETH/USD Price ID:", vm.toString(params.ethUsdPriceId));
    }
}
