// SPDX-License-Identifier: UNKNOWN
pragma solidity ^0.8.30;

interface IUniswapV3Pool {
    function initialize(uint160 sqrtPriceX96) external;

    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1);
}
