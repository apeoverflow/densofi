// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./NFTMinter.sol";
import {InitialSupplySuperchainERC20} from "./InitialSupplySuperchainERC20.sol";

contract TokenMinter is AccessControl, IERC721Receiver {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Reference to the NFT contract
    NFTMinter public nftContract;
    
    // Mapping to track which NFTs have been used to mint tokens
    mapping(uint256 => bool) public usedNFTs;
    
    // Mapping to store created token contracts
    mapping(uint256 => address) public nftToToken;
    
    // Mapping to store NFT names
    mapping(uint256 => string) private _nftNames;
    
    event TokenCreated(uint256 indexed nftId, address tokenAddress, string tokenName);
    event NFTReceived(uint256 indexed tokenId, address from);
    
    constructor(address _nftContract) {
        nftContract = NFTMinter(_nftContract);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    /**
     * @dev Creates a new Superchain ERC20 token based on an NFT
     * @param nftId The ID of the NFT to use as reference
     */
    function createTokenFromNFT(uint256 nftId) public onlyRole(MINTER_ROLE) {
        require(!usedNFTs[nftId], "NFT already used to create a token");
        
        // This will revert with "ERC721: invalid token ID" if the token doesn't exist
        address owner = nftContract.ownerOf(nftId);
        require(owner == msg.sender, "ERC721: caller is not token owner");
        
        string memory nftName = nftContract.tokenName(nftId);
        string memory tokenName = string(abi.encodePacked(nftName, " Token"));
        string memory tokenSymbol = string(abi.encodePacked(nftName, "T"));
        
        // Store the NFT name before transfer
        _nftNames[nftId] = nftName;
        
        // Transfer the NFT to this contract and emit event
        nftContract.transferFrom(msg.sender, address(this), nftId);
        emit NFTReceived(nftId, msg.sender);
        
        // Create new Superchain ERC20 token with 1 million initial supply
        InitialSupplySuperchainERC20 newToken = new InitialSupplySuperchainERC20(
            msg.sender,  // owner
            tokenName,   // name
            tokenSymbol, // symbol
            18,         // decimals
            1_000_000 * 10**18, // initial supply (1 million tokens with 18 decimals)
            block.chainid // initial supply chain ID (current chain)
        );
        
        // Mark NFT as used
        usedNFTs[nftId] = true;
        
        // Store the token contract address
        nftToToken[nftId] = address(newToken);
        
        emit TokenCreated(nftId, address(newToken), tokenName);
    }
    
    /**
     * @dev Returns the token contract address for a given NFT ID
     * @param nftId The ID of the token
     */
    function getTokenAddress(uint256 nftId) public view returns (address) {
        return nftToToken[nftId];
    }
    
    /**
     * @dev Returns the name of the NFT stored in the contract
     * @param nftId The ID of the NFT
     */
    function getStoredNFTName(uint256 nftId) public view returns (string memory) {
        return _nftNames[nftId];
    }
    
    /**
     * @dev Required by IERC721Receiver
     */
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
    
    /**
     * @dev Required by IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
