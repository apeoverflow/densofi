// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Testing utilities
import {Test} from "forge-std/Test.sol";

// Target contracts
import {NFTMinter} from "../src/NFTMinter.sol";
import {TokenMinter} from "../src/TokenMinter.sol";
import {InitialSupplySuperchainERC20} from "../src/InitialSupplySuperchainERC20.sol";

/// @title TokenMinterTest
/// @notice Contract for testing the TokenMinter contract.
contract TokenMinterTest is Test {
    address internal constant ZERO_ADDRESS = address(0);
    
    NFTMinter public nftMinter;
    TokenMinter public tokenMinter;
    address public owner;
    address public user1;
    address public user2;
    bytes32 public MINTER_ROLE;
    bytes32 public NFT_MINTER_ROLE;
    
    /// @notice Sets up the test suite.
    function setUp() public {
        // Get signers
        owner = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        
        // Deploy the NFT contract
        nftMinter = new NFTMinter();
        
        // Deploy the token minter contract
        tokenMinter = new TokenMinter(address(nftMinter));
        
        // Get the MINTER_ROLE bytes32 values
        MINTER_ROLE = tokenMinter.MINTER_ROLE();
        NFT_MINTER_ROLE = nftMinter.MINTER_ROLE();
        
        // Grant MINTER_ROLE to test contract for both contracts
        vm.startPrank(owner);
        nftMinter.grantRole(NFT_MINTER_ROLE, owner);
        tokenMinter.grantRole(MINTER_ROLE, owner);
        vm.stopPrank();
    }
    
    /// @notice Tests the deployment sets the right owner.
    function test_deployment_setsRightOwner() public {
        assertTrue(tokenMinter.hasRole(tokenMinter.DEFAULT_ADMIN_ROLE(), owner));
    }
    
    /// @notice Tests the deployment assigns the minter role to the owner.
    function test_deployment_assignsMinterRole() public {
        assertTrue(tokenMinter.hasRole(MINTER_ROLE, owner));
    }
    
    /// @notice Tests the deployment sets the correct NFT contract address.
    function test_deployment_setsCorrectNFTContract() public {
        assertEq(address(tokenMinter.nftContract()), address(nftMinter));
    }
    
    /// @notice Tests creating a token from an NFT.
    function test_createTokenFromNFT_createsToken() public {
        // Mint an NFT first
        nftMinter.mint("TestNFT", 1);
        
        // Create a token from the NFT
        tokenMinter.createTokenFromNFT(0);
        
        // Get the created token address
        address tokenAddress = tokenMinter.getTokenAddress(0);
        assertTrue(tokenAddress != ZERO_ADDRESS);
        
        // Create token instance
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(tokenAddress);
        
        // Check token properties
        assertEq(token.name(), "TestNFT Token");
        assertEq(token.symbol(), "TestNFTT");
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), 1_000_000 * 10**18);
    }
    
    /// @notice Tests that NFT is transferred to the token minter contract.
    function test_createTokenFromNFT_transfersNFT() public {
        // Mint an NFT first
        nftMinter.mint("TestNFT", 1);
        
        // Create a token from the NFT
        tokenMinter.createTokenFromNFT(0);
        
        // Check NFT ownership
        assertEq(nftMinter.balanceOf(address(tokenMinter), 0), 1);
        assertEq(nftMinter.balanceOf(owner, 0), 0);
    }
    
    /// @notice Tests that creating a token from a non-existent NFT reverts.
    function test_createTokenFromNFT_nonexistentNFT_reverts() public {
        vm.expectRevert("Must own the NFT");
        tokenMinter.createTokenFromNFT(999);
    }
    
    /// @notice Tests that creating a token from an already used NFT reverts.
    function test_createTokenFromNFT_alreadyUsedNFT_reverts() public {
        // Mint an NFT first
        nftMinter.mint("TestNFT", 1);
        
        // Create a token from the NFT
        tokenMinter.createTokenFromNFT(0);
        
        // Try to create another token from the same NFT
        vm.expectRevert("NFT already used to create a token");
        tokenMinter.createTokenFromNFT(0);
    }
    
    /// @notice Tests that non-minter cannot create a token.
    function test_createTokenFromNFT_nonMinterCannotCreate() public {
        // Mint an NFT first
        nftMinter.mint("TestNFT", 1);
        
        // Try to create a token as non-minter
        vm.expectRevert("AccessControl:");
        vm.prank(user1);
        tokenMinter.createTokenFromNFT(0);
    }
    
    /// @notice Tests that creating a token from an NFT you don't own reverts.
    function test_createTokenFromNFT_notOwner_reverts() public {
        // Mint an NFT first
        nftMinter.mint("TestNFT", 1);
        
        // Transfer NFT to user1
        nftMinter.safeTransferFrom(owner, user1, 0, 1, "0x");
        
        // Try to create a token from an NFT you don't own
        vm.expectRevert("Must own the NFT");
        tokenMinter.createTokenFromNFT(0);
    }
    
    /// @notice Tests that NFT name is stored in the contract.
    function test_createTokenFromNFT_storesNFTName() public {
        // Mint an NFT first
        nftMinter.mint("TestNFT", 1);
        
        // Create a token from the NFT
        tokenMinter.createTokenFromNFT(0);
        
        // Check stored NFT name
        assertEq(tokenMinter.getStoredNFTName(0), "TestNFT");
    }
    
    /// @notice Tests that getTokenAddress returns zero address for non-existent token.
    function test_getTokenAddress_nonexistentToken_returnsZero() public {
        assertEq(tokenMinter.getTokenAddress(0), ZERO_ADDRESS);
    }
    
    /// @notice Tests that getTokenAddress returns correct token address after creation.
    function test_getTokenAddress_returnsCorrectAddress() public {
        // Mint an NFT first
        nftMinter.mint("TestNFT", 1);
        
        // Create a token from the NFT
        tokenMinter.createTokenFromNFT(0);
        
        // Get the token address
        address tokenAddress = tokenMinter.getTokenAddress(0);
        assertTrue(tokenAddress != ZERO_ADDRESS);
        
        // Create token instance
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(tokenAddress);
        
        // Check token name
        assertEq(token.name(), "TestNFT Token");
    }
} 