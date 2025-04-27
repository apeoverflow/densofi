// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Testing utilities
import {Test} from "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

// Target contracts
import {NFTMinter} from "../src/NFTMinter.sol";
import {TokenMinter} from "../src/TokenMinter.sol";
import {InitialSupplySuperchainERC20} from "../src/InitialSupplySuperchainERC20.sol";

/// @title TokenMinterTest
/// @notice Contract for testing the TokenMinter contract.
contract TokenMinterTest is Test {
    NFTMinter public nftMinter;
    TokenMinter public tokenMinter;
    address public owner;
    address public alice;
    address public bob;
    
    
    /// @notice Sets up the test suite.
    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        
        // Deploy NFTMinter as owner
        vm.startPrank(owner);
        nftMinter = new NFTMinter();
        vm.stopPrank();
        
        // Deploy TokenMinter as owner
        vm.startPrank(owner);
        tokenMinter = new TokenMinter(address(nftMinter));
        vm.stopPrank();
    }
    
    
    /// @notice Tests that creating a token from an NFT works correctly.
    function test_createTokenFromNFT_succeeds() public {
        // Mint an NFT as owner
        vm.startPrank(owner);
        nftMinter.mint("Test NFT");
        
        // Approve the TokenMinter contract to transfer the NFT
        nftMinter.setApprovalForAll(address(tokenMinter), true);
        
        // Create a token from the NFT and verify the returned address
        address returnedTokenAddress = tokenMinter.createTokenFromNFT(0);
        vm.stopPrank();
        
        // Verify the returned address matches the stored address
        address storedTokenAddress = tokenMinter.getTokenAddress(0);
        assertEq(returnedTokenAddress, storedTokenAddress);
        assertTrue(returnedTokenAddress != address(0));
        
        // Verify the NFT is now owned by the TokenMinter contract
        assertEq(nftMinter.balanceOf(address(tokenMinter), 0), 1);
        
        // Verify the token name was stored
        assertEq(tokenMinter.getNFTName(0), "Test NFT");
        
        // Verify the token contract was created with the correct parameters
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(returnedTokenAddress);
        assertEq(token.name(), "Test NFT Token");
        assertEq(token.symbol(), "Test NFTT");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 1_000_000 * 10**18);
        assertEq(token.owner(), owner);
    }
    
    /// @notice Tests that creating a token from a non-existent NFT reverts.
    function test_createTokenFromNFT_nonexistentNFT_reverts() public {
        vm.startPrank(owner);
        vm.expectRevert("ERC1155: caller is not token owner");
        tokenMinter.createTokenFromNFT(0);
        vm.stopPrank();
    }
    
    /// @notice Tests that creating a token from an NFT that the caller does not own reverts.
    function test_createTokenFromNFT_notOwner_reverts() public {
        // Mint an NFT as owner
        vm.startPrank(owner);
        nftMinter.mint("Test NFT");
        vm.stopPrank();
        
        // Try to create a token from the NFT as alice
        vm.startPrank(alice);
        vm.expectRevert("ERC1155: caller is not token owner");
        tokenMinter.createTokenFromNFT(0);
        vm.stopPrank();
    }
    
    /// @notice Tests that creating a token from an NFT that has already been used reverts.
    function test_createTokenFromNFT_alreadyUsed_reverts() public {
        // Mint an NFT as owner
        vm.startPrank(owner);
        nftMinter.mint("Test NFT");
        
        // Approve the TokenMinter contract to transfer the NFT
        nftMinter.setApprovalForAll(address(tokenMinter), true);
        
        // Create a token from the NFT
        address tokenAddress = tokenMinter.createTokenFromNFT(0);
        assertTrue(tokenAddress != address(0));
        
        // Try to create another token from the same NFT
        vm.expectRevert("NFT already used to create a token");
        tokenMinter.createTokenFromNFT(0);
        vm.stopPrank();
    }
    
    /// @notice Tests that non-owner can create tokens from NFTs they own.
    function test_createTokenFromNFT_nonMinter_succeeds() public {
        // Mint an NFT as owner
        vm.startPrank(owner);
        nftMinter.mint("Test NFT");
        vm.stopPrank();
        
        // Transfer NFT to alice
        vm.startPrank(owner);
        nftMinter.safeTransferFrom(owner, alice, 0, 1, "");
        vm.stopPrank();
        
        // Create a token from the NFT as alice (non-minter)
        vm.startPrank(alice);
        nftMinter.setApprovalForAll(address(tokenMinter), true);
        address tokenAddress = tokenMinter.createTokenFromNFT(0);
        vm.stopPrank();
        
        // Verify the token was created successfully
        assertTrue(tokenAddress != address(0));
        assertEq(nftMinter.balanceOf(address(tokenMinter), 0), 1);
        assertEq(tokenMinter.getNFTName(0), "Test NFT");
    }
    
} 