// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTMinter is ERC721, AccessControl {
    using Strings for uint256;
    
    // Define the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Mapping to store token names
    mapping(uint256 => string) private _tokenNames;
    
    // Counter for token IDs
    uint256 private _tokenIdCounter;
    
    // Event emitted when a new NFT is minted
    event NFTMinted(uint256 indexed tokenId, address indexed to, string name);
    
    constructor() ERC721("NFTMinter", "NFTM") {
        // Grant the contract deployer both the default admin role and minter role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    /**
     * @dev Mints a new NFT with the given name
     * @param name The name of the NFT
     * @return tokenId The ID of the newly minted token
     */
    function mint(string memory name) public onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _tokenNames[tokenId] = name;
        _safeMint(msg.sender, tokenId);
        
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
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked("ipfs://", tokenId.toString()));
    }
    
    // The following function is needed to properly override both ERC721 and AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 