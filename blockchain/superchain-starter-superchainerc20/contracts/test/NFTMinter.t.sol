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
    function test_deployment_setsRightOwner() public {
        assertTrue(nftMinter.hasRole(DEFAULT_ADMIN_ROLE, owner));
    }
    
    /// @notice Tests that the deployment assigns the minter role to the owner.
    function test_deployment_assignsMinterRole() public {
        assertTrue(nftMinter.hasRole(MINTER_ROLE, owner));
    }
    
    /// @notice Tests that minting an NFT sets the correct name.
    function test_mint_setsCorrectName() public {
        string memory name = "Test NFT";
        
        vm.startPrank(owner);
        nftMinter.mint(name);
        vm.stopPrank();
        
        assertEq(nftMinter.tokenName(0), name);
    }
    
    /// @notice Tests that minting an NFT increments the token ID counter.
    function test_mint_incrementsTokenId() public {
        vm.startPrank(owner);
        nftMinter.mint("First NFT");
        nftMinter.mint("Second NFT");
        vm.stopPrank();
        
        assertEq(nftMinter.tokenName(1), "Second NFT");
    }
    
    /// @notice Tests that non-minter cannot mint NFTs.
    function test_mint_nonMinterCannotMint() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "AccessControlUnauthorizedAccount(address,bytes32)",
                alice,
                MINTER_ROLE
            )
        );
        nftMinter.mint("Test NFT");
    }
    
    /// @notice Tests that the URI is correctly formatted.
    function test_uri_returnsCorrectFormat() public {
        vm.startPrank(owner);
        nftMinter.mint("Test NFT");
        vm.stopPrank();
        
        assertEq(nftMinter.tokenURI(0), "ipfs://0");
    }
    
    /// @notice Tests that tokens can be transferred.
    function test_transfer_succeeds() public {
        vm.startPrank(owner);
        nftMinter.mint("Test NFT");
        nftMinter.transferFrom(owner, address(aliceHelper), 0);
        vm.stopPrank();
        
        assertEq(nftMinter.ownerOf(0), address(aliceHelper));
    }
    
    /// @notice Tests that transferring without approval reverts.
    function test_transfer_noApproval_reverts() public {
        vm.startPrank(owner);
        nftMinter.mint("Test NFT");
        vm.stopPrank();

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "ERC721InsufficientApproval(address,uint256)",
                alice,
                0
            )
        );
        nftMinter.transferFrom(owner, address(bobHelper), 0);
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
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "AccessControlUnauthorizedAccount(address,bytes32)",
                alice,
                DEFAULT_ADMIN_ROLE
            )
        );
        nftMinter.grantRole(MINTER_ROLE, bob);
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

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "AccessControlUnauthorizedAccount(address,bytes32)",
                alice,
                DEFAULT_ADMIN_ROLE
            )
        );
        nftMinter.revokeRole(MINTER_ROLE, bob);
    }
} 