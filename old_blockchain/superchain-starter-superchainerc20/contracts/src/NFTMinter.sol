// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Interface for the resolver
interface IResolver {
    function owner(bytes32) external view returns (address);
}
    
contract NFTMinter is ERC1155, AccessControl {
    using Strings for uint256;
    
    // Define the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // ENS Resolver address
    address public constant RESOLVER = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;
    
    // Mapping to store token names
    mapping(uint256 => string) private _tokenNames;
    
    // Counter for token IDs
    uint256 private _tokenIdCounter;
    
    // Event emitted when a new NFT is minted
    event NFTMinted(uint256 indexed tokenId, address indexed to, string name);
    
    constructor() ERC1155("ipfs://") {
        // Grant the contract deployer both the default admin role and minter role
        _grantRole(DEFAULT_ADMIN_ROLE, tx.origin);
        _grantRole(MINTER_ROLE, tx.origin);
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
        _mint(msg.sender, tokenId, 1, "");
        
        emit NFTMinted(tokenId, msg.sender, name);
        
        return tokenId;
    }

    function mintViaResolver(string memory name) public returns (uint256 tokenId) {
        require(IResolver(RESOLVER).owner(stringToBytes32(name)) == msg.sender, "Must own domain");
        tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _tokenNames[tokenId] = name;
        _mint(msg.sender, tokenId, 1, "");
        
        emit NFTMinted(tokenId, msg.sender, name);
        
        return tokenId;
    }

    function stringToBytes32(string memory source) public pure returns (bytes32 result) {
    bytes memory tempEmptyStringTest = bytes(source);
    if (tempEmptyStringTest.length == 0) {
        return 0x0;
    }

    assembly {
        result := mload(add(source, 32))
    }
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