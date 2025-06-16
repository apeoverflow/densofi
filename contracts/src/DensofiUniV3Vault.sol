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
    uint256 public s_tokenId;
    INonfungiblePositionManager public s_nfpm;

    constructor(
        address _launcher,
        address _creator,
        address _nonfungiblePositionManager
    ) {
        s_launcher = _launcher; // DensoFi launchpad contract
        s_creator = _creator; // Token creator
        s_nfpm = INonfungiblePositionManager(_nonfungiblePositionManager);
    }

    function collectFees() external {
        require(
            msg.sender == s_creator,
            "DensoFiVault: Only creator can collect fees"
        );

        s_nfpm.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: s_tokenId,
                recipient: s_creator,
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
        require(s_tokenId == 0, "DensoFiVault: Already has position");
        require(msg.sender == address(s_nfpm), "DensoFiVault: Invalid NFT");

        s_tokenId = id;

        return IERC721Receiver.onERC721Received.selector;
    }

    function transferPosition(address to) external {
        require(
            msg.sender == s_creator,
            "DensoFiVault: Only creator can transfer"
        );
        require(s_tokenId != 0, "DensoFiVault: No position to transfer");

        s_nfpm.safeTransferFrom(address(this), to, s_tokenId);
        s_tokenId = 0;
    }
}
