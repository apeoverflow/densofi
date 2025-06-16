// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {INonfungiblePositionManager} from "src/interfaces/INonfungiblePositionManager.sol";

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract DensoFiUniV3Vault is IERC721Receiver {
    address public s_launcher;
    address public s_creator;
    address public s_domainOwner; // Current domain owner (can be different from creator)
    string public s_domainName; // Associated domain name
    uint256 public s_tokenId;
    INonfungiblePositionManager public s_nfpm;

    event DomainOwnershipUpdated(address indexed newOwner, string domainName);
    event FeesCollected(
        address indexed collector,
        uint256 amount0,
        uint256 amount1
    );
    event TokenIdSet(uint256 tokenId);

    modifier onlyLauncher() {
        require(msg.sender == s_launcher, "DensoFiVault: Only launcher");
        _;
    }

    modifier onlyDomainOwner() {
        require(msg.sender == s_domainOwner, "DensoFiVault: Only domain owner");
        _;
    }

    constructor(
        address _launcher,
        address _creator,
        address _nonfungiblePositionManager,
        string memory _domainName
    ) {
        s_launcher = _launcher; // DensoFi launchpad contract
        s_creator = _creator; // Token creator
        s_domainOwner = _creator; // Initially, creator is the domain owner
        s_domainName = _domainName;
        s_nfpm = INonfungiblePositionManager(_nonfungiblePositionManager);
    }

    function collectFees() external onlyDomainOwner {
        s_nfpm.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: s_tokenId,
                recipient: s_domainOwner,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        emit FeesCollected(s_domainOwner, type(uint128).max, type(uint128).max);
    }

    function updateDomainOwner(address newOwner) external onlyLauncher {
        require(newOwner != address(0), "DensoFiVault: Invalid address");
        s_domainOwner = newOwner;
        emit DomainOwnershipUpdated(newOwner, s_domainName);
    }

    function onERC721Received(
        address /* operator */,
        address /* from */,
        uint256 id,
        bytes calldata /* data */
    ) external override returns (bytes4) {
        require(s_tokenId == 0, "DensoFiVault: Already has position");
        require(msg.sender == address(s_nfpm), "DensoFiVault: Invalid NFT");

        s_tokenId = id;
        emit TokenIdSet(id);

        return IERC721Receiver.onERC721Received.selector;
    }

    function setTokenId(uint256 tokenId) external onlyLauncher {
        s_tokenId = tokenId;
        emit TokenIdSet(tokenId);
    }

    // View functions
    function getDomainInfo()
        external
        view
        returns (string memory domainName, address domainOwner, address creator)
    {
        return (s_domainName, s_domainOwner, s_creator);
    }
}
