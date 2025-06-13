// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./IPyth.sol";
import "./PythStructs.sol";

/// @title MockPyth
/// @dev Mock implementation of Pyth price oracle for testing
contract MockPyth is IPyth {
    uint256 private validTimePeriod;
    uint256 private singleUpdateFeeInWei;

    mapping(bytes32 => PythStructs.Price) private prices;

    error StalePrice();
    error InsufficientFee();

    constructor(uint256 _validTimePeriod, uint256 _singleUpdateFeeInWei) {
        validTimePeriod = _validTimePeriod;
        singleUpdateFeeInWei = _singleUpdateFeeInWei;
    }

    function getPrice(
        bytes32 id
    ) external view override returns (PythStructs.Price memory price) {
        return prices[id];
    }

    function getEmaPrice(
        bytes32 id
    ) external view override returns (PythStructs.Price memory price) {
        return prices[id];
    }

    function getPriceNoOlderThan(
        bytes32 id,
        uint age
    ) external view override returns (PythStructs.Price memory price) {
        price = prices[id];
        if (block.timestamp - price.publishTime > age) {
            revert StalePrice();
        }
        return price;
    }

    function getEmaPriceNoOlderThan(
        bytes32 id,
        uint age
    ) external view override returns (PythStructs.Price memory price) {
        price = prices[id];
        if (block.timestamp - price.publishTime > age) {
            revert StalePrice();
        }
        return price;
    }

    function updatePriceFeeds(
        bytes[] calldata updateData
    ) external payable override {
        uint256 requiredFee = getUpdateFee(updateData);
        if (msg.value < requiredFee) {
            revert InsufficientFee();
        }

        // In a real implementation, this would parse the updateData
        // For mock purposes, we don't need to implement the parsing
    }

    function updatePriceFeedsIfNecessary(
        bytes[] calldata updateData,
        bytes32[] calldata /* priceIds */,
        uint64[] calldata /* publishTimes */
    ) external payable override {
        this.updatePriceFeeds(updateData);
    }

    function getUpdateFee(
        bytes[] calldata updateData
    ) public view override returns (uint feeAmount) {
        return singleUpdateFeeInWei * updateData.length;
    }

    function parsePriceFeedUpdates(
        bytes[] calldata /* updateData */,
        bytes32[] calldata priceIds,
        uint64 /* minPublishTime */,
        uint64 /* maxPublishTime */
    )
        external
        payable
        override
        returns (PythStructs.PriceFeed[] memory priceFeeds)
    {
        // Mock implementation - return empty array
        priceFeeds = new PythStructs.PriceFeed[](priceIds.length);
        for (uint i = 0; i < priceIds.length; i++) {
            priceFeeds[i] = PythStructs.PriceFeed({
                id: priceIds[i],
                price: prices[priceIds[i]],
                emaPrice: prices[priceIds[i]]
            });
        }
    }

    // Mock-specific functions for testing
    function createPriceFeedUpdateData(
        bytes32 id,
        int64 price,
        uint64 conf,
        int32 expo,
        int64 emaPrice,
        uint64 emaConf,
        uint64 publishTime,
        uint64 prevPublishTime
    ) external pure returns (bytes memory) {
        // Return mock data - in real implementation this would be encoded binary data
        return
            abi.encode(
                id,
                price,
                conf,
                expo,
                emaPrice,
                emaConf,
                publishTime,
                prevPublishTime
            );
    }

    function updatePrice(
        bytes32 id,
        int64 price,
        uint64 conf,
        int32 expo,
        uint64 publishTime
    ) external {
        prices[id] = PythStructs.Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: publishTime
        });
    }

    function setValidTimePeriod(uint256 _validTimePeriod) external {
        validTimePeriod = _validTimePeriod;
    }

    function setSingleUpdateFeeInWei(uint256 _singleUpdateFeeInWei) external {
        singleUpdateFeeInWei = _singleUpdateFeeInWei;
    }
}
