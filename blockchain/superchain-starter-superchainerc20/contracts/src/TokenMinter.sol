// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC1155 as INameWrapper} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "./NFTMinter.sol";
// import {InitialSupplySuperchainERC20} from "./InitialSupplySuperchainERC20.sol";
import {Token} from "./Token.sol";


// This contract turns ERC1155 NFTs, like ENS names that are in the NameWrapper, into ERC20 tokens
// NameWrappper usually contains .eth names, but can also have DNS names
contract TokenMinter is ERC1155Holder {
    // bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Reference to the NFT contract
    INameWrapper public constant nameWrapper = INameWrapper(0x0635513f179D50A207757E05759CbD106d7dFcE8);
    
    // Mapping to track which NFTs have been used to mint tokens
    mapping(uint256 => bool) public usedNFTs;
    
    // Mapping to store created token contracts
    mapping(uint256 => address) public nftToToken;
    
    // Mapping to store NFT names
    mapping(uint256 => string) private _nftNames;
    
    event TokenCreated(uint256 indexed tokenId, address tokenAddress, string tokenName);
    event NFTReceived(uint256 indexed tokenId, address from, uint256 amount);
    
    // Find address of NameWrapper on mainnet and sepolia here
    // https://docs.ens.domains/learn/deployments
    // constructor(address _nameWrapper) {
        // nameWrapper = INameWrapper(_nameWrapper);
    // }
    
    /**
     * @notice Creates a new Superchain ERC20 token based on an NFT
     * @dev The user must approve this contract to access its NFT before calling this
     * @param tokenId The token ID of the NFT in the NameWrapper contract
     */
    function createTokenFromNFT(uint256 tokenId) public returns (address) {
        require(nameWrapper.balanceOf(msg.sender, tokenId) > 0, "Caller must own the NFT");
        require(!usedNFTs[tokenId], "NFT already used to create a token");
        
        // TODO: Decode name from NameWrapper instead of hardcoding
        string memory nftName = "test.eth";
        string memory tokenName = string(abi.encodePacked(nftName, " Token"));
        string memory tokenSymbol = string(abi.encodePacked(nftName, "T"));
        
        // Store the NFT name before transfer
        _nftNames[tokenId] = nftName;
        
        // Transfer the NFT to this contract and emit event
        nameWrapper.safeTransferFrom(msg.sender, address(this), tokenId, 1, "");
        emit NFTReceived(tokenId, msg.sender, 1);
        
        // Create new Superchain ERC20 token with 1 million initial supply
        IERC20 newToken = new Token(
            // msg.sender,  // owner
            tokenName,   // name
            tokenSymbol // symbol
            // 18,         // decimals
            // 1_000_000 * 10**18, // initial supply (1 million tokens with 18 decimals)
            // block.chainid // initial supply chain ID (current chain)
        );
        
        // Mark NFT as used
        usedNFTs[tokenId] = true;
        
        // Store the token contract address
        nftToToken[tokenId] = address(newToken);
        
        emit TokenCreated(tokenId, address(newToken), tokenName);
        return address(newToken);
    }
    
    /**
     * @dev Returns the token contract address for a given NFT ID
     * @param tokenId The ID of the token
     */
    function getTokenAddress(uint256 tokenId) public view returns (address) {
        return nftToToken[tokenId];
    }
    
    /**
     * @dev Returns the name of the NFT stored in the contract
     * @param tokenId The ID of the NFT
     */
    function getStoredNFTName(uint256 tokenId) public view returns (string memory) {
        return _nftNames[tokenId];
    }
    
    /**
     * @dev Required by IERC165
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC1155Holder) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
