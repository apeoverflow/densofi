// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

// Testing utilities
import {Test} from "forge-std/Test.sol";

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

// Target contracts
import {TokenMinter} from "../src/TokenMinter.sol";
import {Token} from "../src/Token.sol";

/// @title TokenMinterTest
/// @notice Contract for testing the TokenMinter contract.
contract TokenMinterTest is Test {
    address internal constant ZERO_ADDRESS = address(0);
    
    MockNameWrapper public nameWrapper;
    TokenMinter public tokenMinter;
    
    address public owner = address(this);
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");
    
    /// @notice Sets up the test suite.
    function setUp() public {
        // Deploy the NFT contract
        nameWrapper = new MockNameWrapper();
        
        // Deploy the token minter contract
        tokenMinter = new TokenMinter(address(nameWrapper));
    }
    
    /// @notice Tests creating a token from an NFT.
    function test_createTokenFromNFT_createsToken() public { 
        // Mint tokenId 1 to `user1`
        nameWrapper.mint(user1, 1);
        
        // Create a token from the NFT
        vm.startPrank(user1);
        // Allows the TokenMinter to take the NFT from the sender
        nameWrapper.setApprovalForAll(address(tokenMinter), true);
        // Transfers the NFT to the TokenMinter contract and creates ERC20 token from it
        address newTokenAddress = tokenMinter.createTokenFromNFT(1);
        vm.stopPrank();

        assertNotEq(newTokenAddress, ZERO_ADDRESS);
        
        // Get the created token address
        // address tokenAddress = tokenMinter.getTokenAddress(0);
        // assertTrue(tokenAddress != ZERO_ADDRESS);
        
        // Create token instance
        // InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(tokenAddress);
        
        // Check token properties
        // assertEq(token.name(), "TestNFT Token");
        // assertEq(token.symbol(), "TestNFTT");
        // assertEq(token.decimals(), 18);
        // assertEq(token.totalSupply(), 1_000_000 * 10**18);
    }

    /// @notice Tests that creating a token from an already used NFT reverts.
    // function test_createTokenFromNFT_alreadyUsedNFT_reverts() public {
    //     // Mint an NFT first
    //     nftMinter.mint("TestNFT", 1);
        
    //     // Create a token from the NFT
    //     tokenMinter.createTokenFromNFT(0);
        
    //     // Try to create another token from the same NFT
    //     vm.expectRevert("NFT already used to create a token");
    //     tokenMinter.createTokenFromNFT(0);
    // }
} 

contract MockNameWrapper is ERC1155 {
    constructor() ERC1155("") {
    }

    function mint(address owner, uint256 tokenId) external {
        _mint(owner, tokenId, 1, "");
    }
}