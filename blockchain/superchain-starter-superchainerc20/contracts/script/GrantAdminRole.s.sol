// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import "forge-std/Script.sol";
import "../src/NFTMinter.sol";

contract GrantAdminRole is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Get the NFTMinter address from environment variable
        address nftMinterAddress = vm.envAddress("NFT_MINTER_ADDRESS");
        NFTMinter nftMinter = NFTMinter(nftMinterAddress);

        // Get the deployer address
        address deployer = vm.addr(deployerPrivateKey);

        // Grant DEFAULT_ADMIN_ROLE to the deployer
        bytes32 adminRole = nftMinter.DEFAULT_ADMIN_ROLE();
        nftMinter.grantRole(adminRole, deployer);

        vm.stopBroadcast();
    }
} 