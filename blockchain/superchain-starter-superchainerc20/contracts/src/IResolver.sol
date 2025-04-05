// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IResolver {
    function owner(bytes32) external view returns (address);
} 