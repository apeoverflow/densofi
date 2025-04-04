// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NFTMinter is ERC1155, AccessControl {
    using Strings for uint256;
    
    // Define the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Mapping to store token names
    mapping(uint256 => string) private _tokenNames;
    
    // Counter for token IDs
    uint256 private _tokenIdCounter;
    
    constructor() ERC1155("") {
        // Grant the contract deployer both the default admin role and minter role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    /**
     * @dev Mints a new NFT with the given name
     * @param name The name of the NFT
     * @param amount The amount of tokens to mint
     */
    function mint(string memory name, uint256 amount) public onlyRole(MINTER_ROLE) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _tokenNames[tokenId] = name;
        _mint(msg.sender, tokenId, amount, "");
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
    
    // The following function is needed to properly override both ERC1155 and AccessControl
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 