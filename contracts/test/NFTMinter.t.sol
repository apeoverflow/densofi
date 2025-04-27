// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Testing utilities
import {Test} from "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

// Target contract
import {NFTMinter} from "../src/NFTMinter.sol";

// Helper contract to make addresses ERC1155 receivers
contract ERC1155ReceiverHelper is IERC1155Receiver {
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }
    
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }
    
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }
}

/// @title NFTMinterTest
/// @notice Contract for testing the NFTMinter contract.
contract NFTMinterTest is Test {
    NFTMinter public nftMinter;
    address public owner;
    address public alice;
    address public bob;
    ERC1155ReceiverHelper public aliceHelper;
    ERC1155ReceiverHelper public bobHelper;


    /// @notice Sets up the test suite.
    function setUp() public {
        owner = makeAddr("owner");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        aliceHelper = new ERC1155ReceiverHelper();
        bobHelper = new ERC1155ReceiverHelper();
        
        vm.startPrank(owner);
        nftMinter = new NFTMinter();
        vm.stopPrank();
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
    
    
    /// @notice Tests that the URI is correctly formatted.
    function test_uri_returnsCorrectFormat() public {
        vm.startPrank(owner);
        uint256 tokenId = nftMinter.mint("Test NFT");
        vm.stopPrank();
        
        assertEq(nftMinter.uri(tokenId), "ipfs://0");
    }
    
    /// @notice Tests that tokens can be transferred.
    function test_transfer_succeeds() public {
        vm.startPrank(owner);
        uint256 tokenId = nftMinter.mint("Test NFT");
        nftMinter.safeTransferFrom(owner, alice, tokenId, 1, "");
        vm.stopPrank();
        
        assertEq(nftMinter.balanceOf(alice, tokenId), 1);
    }
    
    /// @notice Tests that transferring without approval reverts.
    function test_transfer_noApproval_reverts() public {
        vm.startPrank(owner);
        uint256 tokenId = nftMinter.mint("Test NFT");
        vm.stopPrank();
        
        vm.startPrank(alice);
        vm.expectRevert(
            abi.encodeWithSignature(
                "ERC1155MissingApprovalForAll(address,address)",
                alice,
                owner
            )
        );
        nftMinter.safeTransferFrom(owner, bob, tokenId, 1, "");
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