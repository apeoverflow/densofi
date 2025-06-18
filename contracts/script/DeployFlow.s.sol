// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {DomainRegistration} from "../src/DomainRegistration.sol";
import {NFTMinter} from "../src/NFTMinter.sol";
import {TokenMinter} from "../src/TokenMinter.sol";
import {DensoFiLaunchpad} from "../src/DensofiLaunchpad.sol";
import {ChainConfig} from "./ChainConfig.sol";

/**
 * @title DeployFlow
 * @notice Simplified deployment script for Flow network
 * @dev Uses regular deployment without CreateX to avoid RPC issues
 */
contract DeployFlow is Script {
    // Deployment addresses
    address public domainRegistrationAddress;
    address public nftMinterAddress;
    address public tokenMinterAddress;
    address public launchpadAddress;

    // Chain configuration
    ChainConfig.ChainParameters private chainParams;

    // Deployer address (will be set as owner)
    address private deployer;

    function run() public {
        uint256 privateKeyInt = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKeyInt);

        // Set deployer address
        deployer = vm.addr(privateKeyInt);
        console2.log("Deploying with address:", deployer);

        // Get chain-specific parameters for Flow (747)
        chainParams = ChainConfig.getChainParameters(747);
        console2.log("Using chain ID: 747 (Flow)");
        console2.log(
            "Domain registration fee:",
            chainParams.domainRegistrationFee
        );

        // Deploy contracts using regular deployment
        deployContracts();

        console2.log("\nDeployments complete!");
        console2.log(
            "DomainRegistration deployed at:",
            domainRegistrationAddress
        );
        console2.log("NFTMinter deployed at:", nftMinterAddress);
        console2.log("TokenMinter deployed at:", tokenMinterAddress);
        console2.log("Launchpad deployed at:", launchpadAddress);

        // Save deployment addresses to JSON file
        saveDeploymentAddresses();

        vm.stopBroadcast();
    }

    function deployContracts() internal {
        console2.log("\nDeploying DomainRegistration...");
        DomainRegistration domainRegistration = new DomainRegistration(
            chainParams.domainRegistrationFee,
            deployer
        );
        domainRegistrationAddress = address(domainRegistration);
        console2.log(
            "DomainRegistration deployed at:",
            domainRegistrationAddress
        );

        console2.log("\nDeploying NFTMinter...");
        NFTMinter nftMinter = new NFTMinter(deployer);
        nftMinterAddress = address(nftMinter);
        console2.log("NFTMinter deployed at:", nftMinterAddress);

        console2.log("\nDeploying Launchpad...");
        DensoFiLaunchpad launchpad = new DensoFiLaunchpad(
            deployer,
            chainParams.uniV3Router,
            chainParams.uniV3Factory,
            chainParams.nonfungiblePositionManager,
            chainParams.weth,
            chainParams.pythOracle,
            chainParams.ethUsdPriceId
        );
        launchpadAddress = address(launchpad);
        console2.log("Launchpad deployed at:", launchpadAddress);

        console2.log("\nDeploying TokenMinter...");
        TokenMinter tokenMinter = new TokenMinter(
            deployer,
            nftMinterAddress,
            launchpadAddress
        );
        tokenMinterAddress = address(tokenMinter);
        console2.log("TokenMinter deployed at:", tokenMinterAddress);
    }

    function saveDeploymentAddresses() internal {
        string memory json = string(
            abi.encodePacked(
                "{\n",
                '  "chainId": 747,\n',
                '  "deployer": "',
                vm.toString(deployer),
                '",\n',
                '  "addresses": {\n',
                '    "domainRegistration": "',
                vm.toString(domainRegistrationAddress),
                '",\n',
                '    "nftMinter": "',
                vm.toString(nftMinterAddress),
                '",\n',
                '    "tokenMinter": "',
                vm.toString(tokenMinterAddress),
                '",\n',
                '    "launchpad": "',
                vm.toString(launchpadAddress),
                '"\n',
                "  },\n",
                '  "parameters": {\n',
                '    "domainRegistrationFee": "',
                vm.toString(chainParams.domainRegistrationFee),
                '",\n',
                '    "uniV3Router": "',
                vm.toString(chainParams.uniV3Router),
                '",\n',
                '    "uniV3Factory": "',
                vm.toString(chainParams.uniV3Factory),
                '",\n',
                '    "nonfungiblePositionManager": "',
                vm.toString(chainParams.nonfungiblePositionManager),
                '",\n',
                '    "weth": "',
                vm.toString(chainParams.weth),
                '",\n',
                '    "pythOracle": "',
                vm.toString(chainParams.pythOracle),
                '",\n',
                '    "ethUsdPriceId": "',
                vm.toString(chainParams.ethUsdPriceId),
                '",\n',
                '    "tokenMinterFixedFee": "',
                vm.toString(chainParams.tokenMinterFixedFee),
                '"\n',
                "  }\n",
                "}"
            )
        );

        string memory filename = "deployment-addresses/747-addresses.json";
        vm.writeFile(filename, json);
        console2.log("Deployment addresses saved to:", filename);
    }
}
