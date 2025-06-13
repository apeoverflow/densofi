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
    address public launcher;
    address public creator;
    uint256 public tokenId;
    INonfungiblePositionManager public nfpm;

    constructor(
        address _launcher,
        address _creator,
        address _nonfungiblePositionManager
    ) {
        launcher = _launcher; // DensoFi launchpad contract
        creator = _creator; // Token creator
        nfpm = INonfungiblePositionManager(_nonfungiblePositionManager);
    }

    function collectFees() external {
        require(
            msg.sender == creator,
            "DensoFiVault: Only creator can collect fees"
        );

        nfpm.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: creator,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );
    }

    function onERC721Received(
        address /* operator */,
        address /* from */,
        uint256 id,
        bytes calldata /* data */
    ) external override returns (bytes4) {
        require(tokenId == 0, "DensoFiVault: Already has position");
        require(msg.sender == address(nfpm), "DensoFiVault: Invalid NFT");

        tokenId = id;

        return IERC721Receiver.onERC721Received.selector;
    }

    function transferPosition(address to) external {
        require(
            msg.sender == creator,
            "DensoFiVault: Only creator can transfer"
        );
        require(tokenId != 0, "DensoFiVault: No position to transfer");

        nfpm.safeTransferFrom(address(this), to, tokenId);
        tokenId = 0;
    }
}
