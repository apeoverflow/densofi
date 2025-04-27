// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { Vm } from "forge-std/Vm.sol";
import {console} from "forge-std/console.sol";

library DeployUtils {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    /**
     * @notice Deploys a contract using standard CREATE opcode with randomization option
     * @param _contractName The name of the contract for logging
     * @param _initCode The contract creation code 
     * @param _randomizeDeployments Debug flag - when true, adds a nonce to allow multiple deployments
     * @return addr_ The address of the deployed contract
     */
    function deployContract(
        string memory _contractName,
        bytes memory _initCode,
        bool _randomizeDeployments
    ) internal returns (address addr_) {
        // Create a nonce for randomized deployments if requested
        if (_randomizeDeployments) {
            // Random salt to make deployment address unique
            bytes32 salt = keccak256(abi.encodePacked(block.timestamp, block.prevrandao));
            
            // Simple CREATE2 deployment without external dependencies
            assembly {
                addr_ := create2(0, add(_initCode, 0x20), mload(_initCode), salt)
                if iszero(extcodesize(addr_)) {
                    revert(0, 0)
                }
            }
        } else {
            // Standard CREATE deployment
            assembly {
                addr_ := create(0, add(_initCode, 0x20), mload(_initCode))
                if iszero(extcodesize(addr_)) {
                    revert(0, 0)
                }
            }
        }

        console.log("Deployed %s at address: %s on chain id: %s", _contractName, addr_, block.chainid);
    }
    
    /**
     * @notice Backward compatibility function that defaults to non-randomized deployments
     */
    function deployContract(
        string memory _contractName,
        bytes32, // Unused salt parameter for backward compatibility  
        bytes memory _initCode
    ) internal returns (address addr_) {
        return deployContract(_contractName, _initCode, false);
    }
}
