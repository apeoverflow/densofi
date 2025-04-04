// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Testing utilities
import {Test} from "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Target contract
import {NFTMinter} from "../src/NFTMinter.sol";

// Helper contract to make addresses ERC721 receivers
contract ERC721ReceiverHelper is IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}

/// @title NFTMinterTest
/// @notice Contract for testing the NFTMinter contract.
contract NFTMinterTest is Test {
    NFTMinter public nftMinter;
    address public owner;
    address public alice;
    address public bob;
    ERC721ReceiverHelper public aliceHelper;
    ERC721ReceiverHelper public bobHelper;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /// @notice Sets up the test suite.
    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        aliceHelper = new ERC721ReceiverHelper();
        bobHelper = new ERC721ReceiverHelper();
        
        vm.startPrank(owner);
        nftMinter = new NFTMinter();
        vm.stopPrank();
    }
    
    /// @notice Tests that the deployment sets the right owner.
    function test_deployment_setsRightOwner() public view {
        assertTrue(nftMinter.hasRole(DEFAULT_ADMIN_ROLE, owner));
    }
    
    /// @notice Tests that the deployment assigns the minter role to the owner.
    function test_deployment_assignsMinterRole() public view {
        assertTrue(nftMinter.hasRole(MINTER_ROLE, owner));
    }
    
    /// @notice Tests that minting an NFT sets the correct name.
    function test_mint_setsCorrectName() public {
        vm.startPrank(owner);
        uint256 tokenId = nftMinter.mint("Test NFT");
        vm.stopPrank();
        
        assertEq(nftMinter.tokenName(tokenId), "Test NFT");
    }
    
    /// @notice Tests that minting an NFT increments the token ID counter.
    function test_mint_incrementsTokenId() public {
        vm.startPrank(owner);
        uint256 tokenId1 = nftMinter.mint("NFT 1");
        uint256 tokenId2 = nftMinter.mint("NFT 2");
        vm.stopPrank();
        
        assertEq(tokenId1, 0);
        assertEq(tokenId2, 1);
    }
    
    /// @notice Tests that non-minter cannot mint NFTs.
    function test_mint_nonMinterCannotMint() public {
        vm.startPrank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "AccessControlUnauthorizedAccount(address,bytes32)",
                alice,
                MINTER_ROLE
            )
        );
        nftMinter.mint("Test NFT");
        vm.stopPrank();
    }
    
    /// @notice Tests that the URI is correctly formatted.
    function test_uri_returnsCorrectFormat() public {
        vm.startPrank(owner);
        uint256 tokenId = nftMinter.mint("Test NFT");
        vm.stopPrank();
        
        assertEq(nftMinter.tokenURI(tokenId), "ipfs://0");
    }
    
    /// @notice Tests that tokens can be transferred.
    function test_transfer_succeeds() public {
        vm.startPrank(owner);
        uint256 tokenId = nftMinter.mint("Test NFT");
        nftMinter.transferFrom(owner, alice, tokenId);
        vm.stopPrank();
        
        assertEq(nftMinter.ownerOf(tokenId), alice);
    }
    
    /// @notice Tests that transferring without approval reverts.
    function test_transfer_noApproval_reverts() public {
        vm.startPrank(owner);
        uint256 tokenId = nftMinter.mint("Test NFT");
        vm.stopPrank();
        
        vm.startPrank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "ERC721InsufficientApproval(address,uint256)",
                alice,
                tokenId
            )
        );
        nftMinter.transferFrom(owner, bob, tokenId);
        vm.stopPrank();
    }
    
    /// @notice Tests that the minter role can be granted.
    function test_grantRole_succeeds() public {
        vm.startPrank(owner);
        nftMinter.grantRole(MINTER_ROLE, alice);
        vm.stopPrank();
        
        assertTrue(nftMinter.hasRole(MINTER_ROLE, alice));
    }
    
    /// @notice Tests that only admin can grant roles.
    function test_grantRole_nonAdmin_reverts() public {
        vm.startPrank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "AccessControlUnauthorizedAccount(address,bytes32)",
                alice,
                DEFAULT_ADMIN_ROLE
            )
        );
        nftMinter.grantRole(MINTER_ROLE, bob);
        vm.stopPrank();
    }
    
    /// @notice Tests that the minter role can be revoked.
    function test_revokeRole_succeeds() public {
        vm.startPrank(owner);
        nftMinter.grantRole(MINTER_ROLE, alice);
        nftMinter.revokeRole(MINTER_ROLE, alice);
        vm.stopPrank();
        
        assertFalse(nftMinter.hasRole(MINTER_ROLE, alice));
    }
    
    /// @notice Tests that only admin can revoke roles.
    function test_revokeRole_nonAdmin_reverts() public {
        vm.startPrank(owner);
        nftMinter.grantRole(MINTER_ROLE, alice);
        vm.stopPrank();
        
        vm.startPrank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "AccessControlUnauthorizedAccount(address,bytes32)",
                alice,
                DEFAULT_ADMIN_ROLE
            )
        );
        nftMinter.revokeRole(MINTER_ROLE, alice);
        vm.stopPrank();
    }
    
    /// @notice Tests that minting emits the NFTMinted event.
    function test_mint_emitsEvent() public {
        vm.startPrank(owner);
        vm.expectEmit(true, true, true, true);
        emit NFTMinter.NFTMinted(0, owner, "Test NFT");
        uint256 tokenId = nftMinter.mint("Test NFT");
        vm.stopPrank();
        
        assertEq(tokenId, 0);
    }
} 