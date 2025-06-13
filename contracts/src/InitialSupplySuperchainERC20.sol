// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {SuperchainERC20} from "@interop-lib/SuperchainERC20.sol";
import {Ownable} from "@solady/auth/Ownable.sol";

contract InitialSupplySuperchainERC20 is SuperchainERC20, Ownable {
    string private _name;
    string private _symbol;
    uint8 private immutable _decimals;

    address internal launcher;
    bool internal launched = false;

    constructor(
        address owner_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply_,
        uint256 initialSupplyChainId_
    ) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;

        _initializeOwner(owner_);

        if (initialSupplyChainId_ == block.chainid) {
            _mint(owner_, initialSupply_);
        }

        // If the owner is not the sender (msg.sender), it means tokens are going to launchpad
        // In this case, the sender (TokenMinter) becomes the launcher
        if (owner_ != msg.sender) {
            launcher = msg.sender;
        } else {
            // If owner is the sender, tokens are received directly and should be launched immediately
            launched = true;
        }
    }

    function name() public view virtual override returns (string memory) {
        return _name;
    }

    function symbol() public view virtual override returns (string memory) {
        return _symbol;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function launch() external {
        require(
            msg.sender == launcher && launched == false,
            "Only launcher can launch and token must not be launched yet"
        );
        launched = true;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (!launched) {
            require(
                from == launcher || to == launcher,
                "transfer not allowed before launch"
            );
        }
    }
}
