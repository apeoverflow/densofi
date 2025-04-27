// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {Vm} from "forge-std/Vm.sol";

import {DeployUtils} from "../libraries/DeployUtils.sol";
import {NFTMinter} from "../src/NFTMinter.sol";
import {TokenMinter} from "../src/TokenMinter.sol";

contract DeployNFTTokenMinter is Script {
    /// @notice Array of RPC URLs to deploy to, deploy to Polygon by default.
    // string[] private rpcUrls = ["https://polygon-rpc.com"];
    string[] private rpcUrls = [
    //     "http://localhost:9545", 
    // "http://localhost:9546"
    // "https://testnet.evm.nodes.onflow.org/" 
    "https://ethereum-sepolia-rpc.publicnode.com"
    // https://mainnet.evm.nodes.onflow.org
    // "https://worldchain-sepolia.g.alchemy.com/public"
    // "https://alfajores-forno.celo-testnet.org/"
    ];

    /// @notice Modifier that wraps a function in broadcasting.
    modifier broadcast() {
        vm.startBroadcast(msg.sender);

        console.log("Deploying as: ", msg.sender);
        _;
        vm.stopBroadcast();
    }

    function run() public {
        for (uint256 i = 0; i < rpcUrls.length; i++) {
            string memory rpcUrl = rpcUrls[i];

            console.log("Deploying to RPC: ", rpcUrl);

            vm.createSelectFork(rpcUrl);
            deployNFTTokenMinterContracts();
        }
    }

    function deployNFTTokenMinterContracts() public broadcast returns (address nftMinterAddr_, address tokenMinterAddr_) {
        // Deploy NFTMinter first
        bytes memory nftMinterInitCode = abi.encodePacked(
            type(NFTMinter).creationCode
        );
        bool randomizeDeployments = vm.envOr("RANDOMIZE_DEPLOYMENTS", true);
        nftMinterAddr_ = DeployUtils.deployContract("NFTMinter", nftMinterInitCode, randomizeDeployments);

        // Deploy TokenMinter with NFTMinter address
        bytes memory tokenMinterInitCode = abi.encodePacked(
            type(TokenMinter).creationCode,
            abi.encode(nftMinterAddr_)
        );
        tokenMinterAddr_ = DeployUtils.deployContract("TokenMinter", tokenMinterInitCode, randomizeDeployments);

        console.log("NFTMinter deployed to: ", nftMinterAddr_);
        console.log("TokenMinter deployed to: ", tokenMinterAddr_);
    }

    // No CREATE2 salt needed for direct deployments
} 
