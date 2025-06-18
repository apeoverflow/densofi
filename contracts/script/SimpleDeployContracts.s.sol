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
 * @title SimpleDeployContracts
 * @notice This script deploys all contracts using simple deployment (no CreateX)
 * @dev Simplified version without deterministic cross-chain addresses
 */
contract SimpleDeployContracts is Script {
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

        // Get chain-specific parameters
        chainParams = ChainConfig.getChainParameters(block.chainid);
        console2.log("Using chain ID:", block.chainid);
        console2.log(
            "Domain registration fee:",
            chainParams.domainRegistrationFee
        );

        // Deploy all contracts
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
        // 1. Deploy DomainRegistration with deployer as owner
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

        // 2. Deploy NFTMinter with deployer as owner
        console2.log("\nDeploying NFTMinter...");
        NFTMinter nftMinter = new NFTMinter(deployer);
        nftMinterAddress = address(nftMinter);
        console2.log("NFTMinter deployed at:", nftMinterAddress);

        // 3. Deploy Launchpad with chain-specific parameters
        console2.log("\nDeploying Launchpad...");
        DensoFiLaunchpad launchpad = new DensoFiLaunchpad(
            deployer, // _owner
            chainParams.uniV3Router, // _uniV3Router
            chainParams.uniV3Factory, // _uniV3Factory
            chainParams.nonfungiblePositionManager, // _nonfungiblePositionManager
            chainParams.weth, // _weth
            chainParams.pythOracle, // _pythOracle
            chainParams.ethUsdPriceId // _ethUsdPriceId
        );
        launchpadAddress = address(launchpad);
        console2.log("Launchpad deployed at:", launchpadAddress);

        // 4. Deploy TokenMinter with deployer as owner, NFTMinter address, and Launchpad address
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
        string memory filename = string(
            abi.encodePacked(
                "deployment-addresses/",
                vm.toString(block.chainid),
                "-addresses.json"
            )
        );

        // Backup existing file if it exists
        backupExistingFile(filename);

        string memory json = string(
            abi.encodePacked(
                "{\n",
                '  "chainId": ',
                vm.toString(block.chainid),
                ",\n",
                '  "deployer": "',
                vm.toString(deployer),
                '",\n',
                '  "timestamp": ',
                vm.toString(block.timestamp),
                ",\n",
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

        vm.writeFile(filename, json);
        console2.log("Deployment addresses saved to:", filename);
    }

    function backupExistingFile(string memory filename) internal {
        // Try to read the existing file
        try vm.readFile(filename) returns (string memory existingContent) {
            // File exists, create backup
            string memory backupFilename = string(
                abi.encodePacked(
                    "deployment-addresses/old-addresses/",
                    vm.toString(block.chainid),
                    "-addresses-",
                    vm.toString(block.timestamp),
                    ".json"
                )
            );

            vm.writeFile(backupFilename, existingContent);
            console2.log(
                "Existing deployment file backed up to:",
                backupFilename
            );
        } catch {
            // File doesn't exist, no backup needed
            console2.log("No existing deployment file found, skipping backup");
        }
    }
}
