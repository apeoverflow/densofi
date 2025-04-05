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
        nftMinterAddr_ = DeployUtils.deployContract("NFTMinter", _implSalt(), nftMinterInitCode);

        // Deploy TokenMinter with NFTMinter address
        bytes memory tokenMinterInitCode = abi.encodePacked(
            type(TokenMinter).creationCode,
            abi.encode(nftMinterAddr_)
        );
        tokenMinterAddr_ = DeployUtils.deployContract("TokenMinter", _implSalt(), tokenMinterInitCode);

        console.log("NFTMinter deployed to: ", nftMinterAddr_);
        console.log("TokenMinter deployed to: ", tokenMinterAddr_);


           // --- Test Contract Calls ---
        NFTMinter nftMinter = NFTMinter(payable(nftMinterAddr_));
        TokenMinter tokenMinter = TokenMinter(payable(tokenMinterAddr_));

        // --- Start Broadcast for role grants and test calls ---
        // vm.startBroadcast(deployerPrivateKey);
        address deployerAddress = msg.sender;

        // Explicitly grant MINTER_ROLE to the deployer on NFTMinter
        bytes32 minterRole = nftMinter.MINTER_ROLE();
        console.log("Granting MINTER_ROLE to deployer (%s) on NFTMinter...", deployerAddress);
        nftMinter.grantRole(minterRole, deployerAddress);

        // Also grant MINTER_ROLE (or equivalent needed for createTokenFromNFT) on TokenMinter
        // Assuming TokenMinter also uses MINTER_ROLE for its creation function
        bytes32 tokenMinterRole = tokenMinter.MINTER_ROLE(); // Adjust if TokenMinter uses a different role name
        console.log("Granting MINTER_ROLE to deployer (%s) on TokenMinter...", deployerAddress);
        tokenMinter.grantRole(tokenMinterRole, deployerAddress);


        console.log("Setting approval for TokenMinter on NFTMinter...");
        nftMinter.setApprovalForAll(tokenMinterAddr_, true);

        console.log("Minting NFT for 'test.com'...");
        nftMinter.mint("test.com"); // Mint NFT for test.com domain
        // Assuming the first minted NFT will have ID 0

        console.log("Creating token from NFT ID 0...");
        tokenMinter.createTokenFromNFT(0); // Create token from the minted NFT (ID 0)

        console.log("Test calls completed successfully.");
        // --- End Test Contract Calls ---
    }

    /// @notice The CREATE2 salt to be used when deploying a contract.
    function _implSalt() internal view returns (bytes32) {
        return keccak256(abi.encodePacked(vm.envOr("DEPLOY_SALT", string("nft-token-minter"))));
    }
} 