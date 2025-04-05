// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

// This gets created by TokenMinter.sol in exchange for an ENS NFT
// Add logic here that actually takes care of tokenized ownership
// Ie if you own x% of totalSupply you can mint subnnames and stuff like that
contract Token is ERC20, ERC20Permit {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name) {
        // Here is where you should mint some initial supply to the owner of the name or something
    }
}