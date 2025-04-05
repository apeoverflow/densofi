// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {Vm} from "forge-std/Vm.sol";
import {ICreateX} from "createx/ICreateX.sol";

import {DeployUtils} from "../libraries/DeployUtils.sol";
import {NFTMinter} from "../src/NFTMinter.sol";
import {TokenMinter} from "../src/TokenMinter.sol";
import {IResolver} from "../src/IResolver.sol";
import {InitialSupplySuperchainERC20} from "../src/InitialSupplySuperchainERC20.sol";

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

        // Verify contract configuration
        NFTMinter nftMinter = NFTMinter(nftMinterAddr_);
        TokenMinter tokenMinter = TokenMinter(tokenMinterAddr_);

        // Verify NFTMinter configuration
        console.log("Verifying NFTMinter configuration...");
        require(nftMinter.RESOLVER() == 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e, "Incorrect resolver address");
        require(nftMinter.hasRole(nftMinter.DEFAULT_ADMIN_ROLE(), msg.sender), "Deployer not admin");
        require(nftMinter.hasRole(nftMinter.MINTER_ROLE(), msg.sender), "Deployer not minter");

        // Verify TokenMinter configuration
        console.log("Verifying TokenMinter configuration...");
        require(address(tokenMinter.nftContract()) == nftMinterAddr_, "Incorrect NFT contract address");
        require(tokenMinter.hasRole(tokenMinter.DEFAULT_ADMIN_ROLE(), msg.sender), "Deployer not admin");
        require(tokenMinter.hasRole(tokenMinter.MINTER_ROLE(), msg.sender), "Deployer not minter");

        console.log("All verifications passed successfully!");

        // Perform onchain test operations
        console.log("Performing onchain test operations...");
        
        // Mock the resolver to return the deployer as the owner of test.eth
        bytes32 nameHash = nftMinter.stringToBytes32("test.eth");
        vm.mockCall(
            nftMinter.RESOLVER(),
            abi.encodeWithSelector(IResolver.owner.selector, nameHash),
            abi.encode(msg.sender)
        );
        
        // Mint test.eth as an NFT
        console.log("Minting test.eth as NFT...");
        uint256 nftId = nftMinter.mintViaResolver("test.eth");
        require(nftMinter.balanceOf(msg.sender, nftId) == 1, "NFT mint failed");
        console.log("NFT minted successfully with ID:", nftId);
        
        // Approve TokenMinter to transfer the NFT
        console.log("Approving TokenMinter to transfer NFT...");
        nftMinter.setApprovalForAll(address(tokenMinter), true);
        
        // Create a token from the NFT
        console.log("Creating token from NFT...");
        address tokenAddress = tokenMinter.createTokenFromNFT(nftId);
        require(tokenAddress != address(0), "Token creation failed");
        console.log("Token created successfully at:", tokenAddress);
        
        // Verify the token was created correctly
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(tokenAddress);
        require(token.owner() == msg.sender, "Token ownership incorrect");
        require(token.totalSupply() == 1_000_000 * 10**18, "Token supply incorrect");
        console.log("Token verification successful!");
    }

    /// @notice The CREATE2 salt to be used when deploying a contract.
    function _implSalt() internal view returns (bytes32) {
        return keccak256(abi.encodePacked(vm.envOr("DEPLOY_SALT", string("nft-token-minter"))));
    }
} 