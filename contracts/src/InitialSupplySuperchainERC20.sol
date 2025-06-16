// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {SuperchainERC20} from "@interop-lib/SuperchainERC20.sol";
import {Ownable} from "@solady/auth/Ownable.sol";

contract InitialSupplySuperchainERC20 is SuperchainERC20, Ownable {
    string private _name;
    string private _symbol;
    uint8 private immutable _decimals;

    address internal immutable s_launcher;
    bool internal s_launched = false;

    constructor(
        address owner_,
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        uint256 initialSupply_,
        uint256 initialSupplyChainId_,
        bool shouldLaunch_
    ) {
        _name = name_;
        _symbol = symbol_;
        _decimals = decimals_;

        _initializeOwner(owner_);

        if (initialSupplyChainId_ == block.chainid) {
            _mint(owner_, initialSupply_);
        }

        // Set launcher and launch status based on shouldLaunch parameter
        if (shouldLaunch_) {
            // Token should be launched immediately (direct receipt case)
            s_launched = true;
        } else {
            // Token goes to launchpad, needs to be launched later
            s_launcher = msg.sender;
            s_launched = false;
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

    function launch() external onlyOwner {
        require(s_launched == false, "Token already launched");
        s_launched = true;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        if (!s_launched) {
            require(
                from == s_launcher || to == s_launcher,
                "transfer not allowed before launch"
            );
        }
        super._beforeTokenTransfer(from, to, amount);
    }
}
