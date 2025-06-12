// SPDX-License-Identifier: UNKNOWN
pragma solidity ^0.8.30;

interface INonfungiblePositionManager {
    function WETH9() external view returns (address);

    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function mint(
        MintParams memory params
    )
        external
        returns (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        );

    function collect(
        CollectParams calldata params
    ) external returns (uint256 amount0, uint256 amount1);

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;
}
