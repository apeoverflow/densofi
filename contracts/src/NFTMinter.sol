// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

    
contract NFTMinter is ERC1155 {
    using Strings for uint256;
    
    
    // Mapping to store token names
    mapping(uint256 => string) private _tokenNames;
    
    // Counter for token IDs
    uint256 private _tokenIdCounter;
    
    // Event emitted when a new NFT is minted
    event NFTMinted(uint256 indexed tokenId, address indexed to, string name);
    
    constructor() ERC1155("ipfs://") {
    }
    
    /**
     * @dev Mints a new NFT with the given name
     * @param name The name of the NFT
     * @return tokenId The ID of the newly minted token
     */
    function mint(string memory name) public returns (uint256 tokenId) {
        tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _tokenNames[tokenId] = name;
        _mint(msg.sender, tokenId, 1, "");
        
        emit NFTMinted(tokenId, msg.sender, name);
        
        return tokenId;
    }

    /**
     * @dev Returns the name of the token
     * @param tokenId The ID of the token
     */
    function tokenName(uint256 tokenId) public view returns (string memory) {
        return _tokenNames[tokenId];
    }
    
    /**
     * @dev Returns the URI for a given token ID
     * @param tokenId The ID of the token
     */
    function uri(uint256 tokenId) public view virtual override returns (string memory) {
        return string(abi.encodePacked("ipfs://", tokenId.toString()));
    }
    
    // The following function is needed to properly override both ERC1155 
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 
