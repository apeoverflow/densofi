// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChainConfig
 * @notice Configuration contract that provides chain-specific parameters for contract deployment
 * @dev Centralizes all chain-specific addresses and parameters needed for deployment
 */
library ChainConfig {
    struct ChainParameters {
        // Core deployment parameters
        uint256 domainRegistrationFee;
        // Uniswap V3 addresses
        address uniV3Router;
        address uniV3Factory;
        address nonfungiblePositionManager;
        address weth;
        // Pyth Oracle
        address pythOracle;
        bytes32 ethUsdPriceId;
        // TokenMinter parameters
        uint256 tokenMinterFixedFee;
    }

    /**
     * @notice Get chain-specific parameters for deployment
     * @param chainId The chain ID to get parameters for
     * @return ChainParameters struct containing all deployment parameters
     */
    function getChainParameters(
        uint256 chainId
    ) internal pure returns (ChainParameters memory) {
        if (chainId == 1) {
            // Ethereum Mainnet
            return
                ChainParameters({
                    domainRegistrationFee: 0.01 ether,
                    uniV3Router: 0xE592427A0AEce92De3Edee1F18E0157C05861564,
                    uniV3Factory: 0x1F98431c8aD98523631AE4a59f267346ea31F984,
                    nonfungiblePositionManager: 0xC36442b4a4522E871399CD717aBDD847Ab11FE88,
                    weth: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
                    pythOracle: 0x4305FB66699C3B2702D4d05CF36551390A4c69C6,
                    ethUsdPriceId: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace,
                    tokenMinterFixedFee: 0.001 ether
                });
        } else if (chainId == 11155111) {
            // Sepolia Testnet
            return
                ChainParameters({
                    domainRegistrationFee: 0.001 ether,
                    uniV3Router: 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E,
                    uniV3Factory: 0x0227628f3F023bb0B980b67D528571c95c6DaC1c,
                    nonfungiblePositionManager: 0x1238536071E1c677A632429e3655c799b22cDA52,
                    weth: 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14,
                    pythOracle: 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21,
                    ethUsdPriceId: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace,
                    tokenMinterFixedFee: 0.0001 ether
                });
        } else if (chainId == 137) {
            // Polygon Mainnet
            return
                ChainParameters({
                    domainRegistrationFee: 1 ether, // 1 MATIC
                    uniV3Router: 0xE592427A0AEce92De3Edee1F18E0157C05861564,
                    uniV3Factory: 0x1F98431c8aD98523631AE4a59f267346ea31F984,
                    nonfungiblePositionManager: 0xC36442b4a4522E871399CD717aBDD847Ab11FE88,
                    weth: 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270, // WMATIC
                    pythOracle: 0xff1a0f4744e8582DF1aE09D5611b887B6a12925C,
                    ethUsdPriceId: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace,
                    tokenMinterFixedFee: 0.1 ether // 0.1 MATIC
                });
        } else if (chainId == 42161) {
            // Arbitrum One
            return
                ChainParameters({
                    domainRegistrationFee: 0.001 ether,
                    uniV3Router: 0xE592427A0AEce92De3Edee1F18E0157C05861564,
                    uniV3Factory: 0x1F98431c8aD98523631AE4a59f267346ea31F984,
                    nonfungiblePositionManager: 0xC36442b4a4522E871399CD717aBDD847Ab11FE88,
                    weth: 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1,
                    pythOracle: 0xff1a0f4744e8582DF1aE09D5611b887B6a12925C,
                    ethUsdPriceId: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace,
                    tokenMinterFixedFee: 0.0001 ether
                });
        } else if (chainId == 10) {
            // Optimism
            return
                ChainParameters({
                    domainRegistrationFee: 0.001 ether,
                    uniV3Router: 0xE592427A0AEce92De3Edee1F18E0157C05861564,
                    uniV3Factory: 0x1F98431c8aD98523631AE4a59f267346ea31F984,
                    nonfungiblePositionManager: 0xC36442b4a4522E871399CD717aBDD847Ab11FE88,
                    weth: 0x4200000000000000000000000000000000000006,
                    pythOracle: 0xff1a0f4744e8582DF1aE09D5611b887B6a12925C,
                    ethUsdPriceId: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace,
                    tokenMinterFixedFee: 0.0001 ether
                });
        } else if (chainId == 8453) {
            // Base
            return
                ChainParameters({
                    domainRegistrationFee: 0.001 ether,
                    uniV3Router: 0x2626664c2603336E57B271c5C0b26F421741e481,
                    uniV3Factory: 0x33128a8fC17869897dcE68Ed026d694621f6FDfD,
                    nonfungiblePositionManager: 0x03A520B32c04BF3Beef7bF5D4f1134f7f6a0A2fD,
                    weth: 0x4200000000000000000000000000000000000006,
                    pythOracle: 0x8250f4aF4B972684F7b336503E2D6dFeDeB1487a,
                    ethUsdPriceId: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace,
                    tokenMinterFixedFee: 0.0001 ether
                });
        } else if (chainId == 84532) {
            // Base Sepolia
            return
                ChainParameters({
                    domainRegistrationFee: 0.001 ether,
                    uniV3Router: 0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4,
                    uniV3Factory: 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24,
                    nonfungiblePositionManager: 0x27F971cb582BF9E50F397e4d29a5C7A34f11faA2,
                    weth: 0x4200000000000000000000000000000000000006,
                    pythOracle: 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729,
                    ethUsdPriceId: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace,
                    tokenMinterFixedFee: 0.0001 ether
                });
        } else if (chainId == 747) {
            // Flow Mainnet with PunchSwap V3
            return
                ChainParameters({
                    domainRegistrationFee: 0.0001 ether,
                    uniV3Router: 0x48Ae9ED61c6ECe580Af86F140AcEC3DDB4A7367E, // PunchSwap QuoterV2
                    uniV3Factory: 0xf331959366032a634c7cAcF5852fE01ffdB84Af0, // PunchSwapV3Factory
                    nonfungiblePositionManager: 0xDfA7829Eb75B66790b6E9758DF48E518c69ee34a, // PunchSwap NonfungiblePositionManager
                    weth: 0xd3bF53DAC106A0290B0483EcBC89d40FcC961f3e, // WFLOW
                    pythOracle: 0x2880aB155794e7179c9eE2e38200202908C17B43, // Pyth Oracle on Flow
                    ethUsdPriceId: 0x2fb245b9a84554a0f15aa123cbb5f64cd263b59e9a87d80148cbffab50c69f30, // Flow USD Price ID
                    tokenMinterFixedFee: 0.0001 ether
                });
        } else {
            // Default/Fallback configuration (use Sepolia as base)
            return
                ChainParameters({
                    domainRegistrationFee: 0.001 ether,
                    uniV3Router: 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E,
                    uniV3Factory: 0x0227628f3F023bb0B980b67D528571c95c6DaC1c,
                    nonfungiblePositionManager: 0x1238536071E1c677A632429e3655c799b22cDA52,
                    weth: 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14,
                    pythOracle: 0xDd24F84d36BF92C65F92307595335bdFab5Bbd21,
                    ethUsdPriceId: 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace,
                    tokenMinterFixedFee: 0.0001 ether
                });
        }
    }

    /**
     * @notice Get supported chain IDs
     * @return Array of supported chain IDs
     */
    function getSupportedChains() internal pure returns (uint256[] memory) {
        uint256[] memory chains = new uint256[](8);
        chains[0] = 1; // Ethereum Mainnet
        chains[1] = 11155111; // Sepolia
        chains[2] = 137; // Polygon
        chains[3] = 42161; // Arbitrum One
        chains[4] = 10; // Optimism
        chains[5] = 8453; // Base
        chains[6] = 84532; // Base Sepolia
        chains[7] = 747; // Flow Mainnet
        return chains;
    }

    /**
     * @notice Check if a chain is supported
     * @param chainId The chain ID to check
     * @return True if the chain is supported
     */
    function isChainSupported(uint256 chainId) internal pure returns (bool) {
        uint256[] memory supportedChains = getSupportedChains();
        for (uint256 i = 0; i < supportedChains.length; i++) {
            if (supportedChains[i] == chainId) {
                return true;
            }
        }
        return false;
    }
}
