// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {Vm} from "forge-std/Vm.sol";
import {ICreateX} from "createx/ICreateX.sol";

import {DeployUtils} from "../libraries/DeployUtils.sol";
import {NFTMinter} from "../src/NFTMinter.sol";
import {TokenMinter} from "../src/TokenMinter.sol";

contract DeployNFTTokenMinter is Script {
    /// @notice Array of RPC URLs to deploy to, deploy to Polygon by default.
    // string[] private rpcUrls = ["https://polygon-rpc.com"];
    string[] private rpcUrls = ["http://localhost:9545", "http://localhost:9546"];

    /// @notice Modifier that wraps a function in broadcasting.
    modifier broadcast() {
        vm.startBroadcast(msg.sender);
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
        nftMinterAddr_ = DeployUtils.deployContract("NFTMinter", _implSalt(), nftMinterInitCode);

        // Deploy TokenMinter with NFTMinter address
        bytes memory tokenMinterInitCode = abi.encodePacked(
            type(TokenMinter).creationCode,
            abi.encode(nftMinterAddr_)
        );
        tokenMinterAddr_ = DeployUtils.deployContract("TokenMinter", _implSalt(), tokenMinterInitCode);

        console.log("NFTMinter deployed to: ", nftMinterAddr_);
        console.log("TokenMinter deployed to: ", tokenMinterAddr_);
    }

    /// @notice The CREATE2 salt to be used when deploying a contract.
    function _implSalt() internal view returns (bytes32) {
        return keccak256(abi.encodePacked(vm.envOr("DEPLOY_SALT", string("nft-token-minter"))));
    }
} 