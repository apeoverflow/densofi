// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Hashing
/// @notice Hashing handles Optimism's various different hashing schemes.
library Hashing {
    /// @notice Generates a unique hash for cross l2 messages. This hash is used to identify
    ///         the message and ensure it is not relayed more than once.
    /// @param _destination Chain ID of the destination chain.
    /// @param _source Chain ID of the source chain.
    /// @param _nonce Unique nonce associated with the message to prevent replay attacks.
    /// @param _sender Address of the user who originally sent the message.
    /// @param _target Address of the contract or wallet that the message is targeting on the destination chain.
    /// @param _message The message payload to be relayed to the target on the destination chain.
    /// @return Hash of the encoded message parameters, used to uniquely identify the message.
    function hashL2toL2CrossDomainMessage(
        uint256 _destination,
        uint256 _source,
        uint256 _nonce,
        address _sender,
        address _target,
        bytes memory _message
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(_destination, _source, _nonce, _sender, _target, _message));
    }
}
