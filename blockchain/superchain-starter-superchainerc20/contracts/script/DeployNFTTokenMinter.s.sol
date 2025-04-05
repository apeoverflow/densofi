// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {Vm} from "forge-std/Vm.sol";

import {TokenMinter} from "../src/TokenMinter.sol";

contract DeployNFTTokenMinter is Script {
    /// @notice RPC URL to deploy to
    string private rpcUrl = "https://ethereum-sepolia-rpc.publicnode.com";

    /// @notice Modifier that wraps a function in broadcasting.
    modifier broadcast() {
        vm.startBroadcast(msg.sender);
        _;
        vm.stopBroadcast();
    }

    function run() public {
        console.log("Deploying to RPC: ", rpcUrl);
        vm.createSelectFork(rpcUrl);
        deployNFTTokenMinterContracts();
    }

    function deployNFTTokenMinterContracts() public broadcast  {
        new TokenMinter(0x0635513f179D50A207757E05759CbD106d7dFcE8);
    }
} 