// SPDX-License-Identifier: UNKNOWN
pragma solidity ^0.8.18;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    address internal launcher;
    bool internal launched = false;

    constructor(
        string memory name,
        string memory symbol,
        uint256 supply,
        address _launcher
    ) ERC20(name, symbol) {
        launcher = _launcher;
        _mint(msg.sender, supply);
    }

    function launch() external {
        require(msg.sender == launcher && launched == false);
        launched = true;
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (!launched) {
            require(
                from == launcher || to == launcher,
                "transfer not allowed before launch"
            );
        }
        super._update(from, to, value);
    }
}
