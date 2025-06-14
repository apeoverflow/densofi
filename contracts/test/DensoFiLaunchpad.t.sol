// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {DensoFiLaunchpad} from "src/DensofiLaunchpad.sol";
import {InitialSupplySuperchainERC20} from "src/InitialSupplySuperchainERC20.sol";
import {DensoFiUniV3Vault} from "src/DensofiUniV3Vault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPyth} from "src/interfaces/IPyth.sol";
import {PythStructs} from "src/interfaces/PythStructs.sol";
import {MockPyth} from "src/interfaces/MockPyth.sol";
import {INonfungiblePositionManager} from "src/interfaces/INonfungiblePositionManager.sol";
import {IUniswapV3Factory} from "src/interfaces/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "src/interfaces/IUniswapV3Pool.sol";

contract DensoFiLaunchpadTest is Test {
    DensoFiLaunchpad public launchpad;
    MockPyth public pythOracle;

    // Mainnet Ethereum addresses (for forking)
    address constant UNISWAP_V3_ROUTER =
        0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address constant UNISWAP_V3_FACTORY =
        0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address constant NONFUNGIBLE_POSITION_MANAGER =
        0xC36442b4a4522E871399CD717aBDD847Ab11FE88;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    // Pyth addresses for mainnet Ethereum
    address constant PYTH_ORACLE = 0x4305FB66699C3B2702D4d05CF36551390A4c69C6;
    bytes32 constant ETH_USD_PRICE_ID =
        0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

    // Test users
    address public creator = makeAddr("creator");
    address public buyer1 = makeAddr("buyer1");
    address public buyer2 = makeAddr("buyer2");
    address public seller = makeAddr("seller");
    address public deployer = makeAddr("deployer");

    // Test token parameters
    string constant TOKEN_NAME = "TestToken";
    string constant TOKEN_SYMBOL = "TEST";
    string constant IMAGE_CID = "QmTest123";
    string constant DESCRIPTION = "A test token for DensoFi launchpad";
    uint16 constant SELL_PENALTY = 100; // 10%

    // Events for testing
    event TokenCreated(
        address indexed creator,
        address indexed token,
        uint256 supply,
        string name,
        string symbol,
        string imageCid,
        string description,
        uint256 price
    );

    event TokenLaunched(
        address indexed creator,
        address indexed token,
        address indexed pool,
        address vault
    );

    function setUp() public {
        // For regular testing (non-fork), use MockPyth
        if (block.number == 1) {
            // We're in a regular test environment, not forking
            pythOracle = new MockPyth(60, 1);

            // Set ETH price to $3000 (with -8 exponent)
            pythOracle.updatePrice(
                ETH_USD_PRICE_ID,
                300000000000, // $3000 with 8 decimals = 3000 * 10^8
                1000000000, // confidence
                -8, // exponent
                uint64(block.timestamp)
            );

            // Deploy the launchpad contract with mock oracle
            vm.prank(deployer);
            launchpad = new DensoFiLaunchpad(
                UNISWAP_V3_ROUTER,
                UNISWAP_V3_FACTORY,
                NONFUNGIBLE_POSITION_MANAGER,
                WETH,
                address(pythOracle),
                ETH_USD_PRICE_ID
            );
        } else {
            // We're in a fork environment, use real Pyth oracle
            vm.prank(deployer);
            launchpad = new DensoFiLaunchpad(
                UNISWAP_V3_ROUTER,
                UNISWAP_V3_FACTORY,
                NONFUNGIBLE_POSITION_MANAGER,
                WETH,
                PYTH_ORACLE,
                ETH_USD_PRICE_ID
            );

            // In fork environment, set a more lenient staleness threshold
            // to handle potentially stale mainnet price data
            vm.prank(deployer);
            launchpad.setMaxPriceStaleness(86400); // 24 hours instead of 1 hour
        }

        // Fund test accounts
        vm.deal(creator, 100 ether);
        vm.deal(buyer1, 50 ether);
        vm.deal(buyer2, 50 ether);
        vm.deal(seller, 50 ether);
        vm.deal(deployer, 10 ether);

        console.log("Setup completed");
        console.log("Launchpad deployed at:", address(launchpad));
    }

    function testOraclePriceAccess() public view {
        uint256 ethPrice = launchpad.getOraclePrice();
        console.log("Current ETH/USD price:", ethPrice / 1e8);

        // ETH price should be reasonable (between $500 and $10000)
        assertGt(ethPrice, 500 * 1e8, "ETH price too low");
        assertLt(ethPrice, 10000 * 1e8, "ETH price too high");
    }

    function testTokenCreation() public {
        uint256 creationFee = getCreationFee();
        uint256 initialBuy = 1 ether;
        uint256 totalPayment = creationFee + initialBuy;

        // Record logs to capture events
        vm.recordLogs();

        vm.prank(creator);
        launchpad.createToken{value: totalPayment}(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            IMAGE_CID,
            DESCRIPTION,
            SELL_PENALTY,
            initialBuy
        );

        // Get the token address from events
        Vm.Log[] memory logs = vm.getRecordedLogs();
        address tokenAddress = address(0);

        for (uint i = 0; i < logs.length; i++) {
            if (
                logs[i].topics[0] ==
                keccak256(
                    "TokenCreated(address,address,uint256,string,string,string,string,uint256)"
                )
            ) {
                tokenAddress = address(uint160(uint256(logs[i].topics[2])));
                break;
            }
        }

        // Verify token was created
        assertTrue(tokenAddress != address(0), "Token not created");

        // Verify token properties
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(
            tokenAddress
        );
        assertEq(token.name(), TOKEN_NAME);
        assertEq(token.symbol(), TOKEN_SYMBOL);
        assertEq(token.totalSupply(), launchpad.TOKEN_SUPPLY());

        // Verify creator received initial tokens
        assertGt(
            token.balanceOf(creator),
            0,
            "Creator should have tokens from initial buy"
        );

        // Verify fake pool was created
        (
            uint256 ethReserve,
            uint256 tokenReserve,
            uint256 fakeEth,
            address poolCreator,
            uint16 penalty,
            bool locked
        ) = launchpad.getPoolInfo(tokenAddress);

        assertGt(
            ethReserve,
            fakeEth,
            "ETH reserve should be greater than fake ETH"
        );
        assertLt(
            tokenReserve,
            launchpad.TOKEN_SUPPLY(),
            "Token reserve should be less than total supply"
        );
        assertEq(poolCreator, creator, "Pool creator should be the creator");
        assertEq(penalty, SELL_PENALTY, "Sell penalty should match");
        assertFalse(locked, "Pool should not be locked initially");

        console.log("Token created successfully:", tokenAddress);
        console.log("ETH Reserve:", ethReserve);
        console.log("Token Reserve:", tokenReserve);
    }

    function testBuyTokens() public {
        // First create a token
        address tokenAddress = createTestToken();

        uint256 buyAmount = 2 ether;
        uint256 expectedTokens = launchpad.quoteTokens(
            tokenAddress,
            buyAmount,
            true
        );

        uint256 initialBalance = InitialSupplySuperchainERC20(tokenAddress)
            .balanceOf(buyer1);

        vm.prank(buyer1);
        launchpad.buyTokens{value: buyAmount}(tokenAddress, expectedTokens);

        uint256 finalBalance = InitialSupplySuperchainERC20(tokenAddress)
            .balanceOf(buyer1);
        uint256 tokensReceived = finalBalance - initialBalance;

        assertGt(tokensReceived, 0, "Should receive tokens");
        assertApproxEqRel(
            tokensReceived,
            expectedTokens,
            0.01e18,
            "Should receive expected amount of tokens"
        );

        console.log("Tokens bought:", tokensReceived);
        console.log("Expected tokens:", expectedTokens);
    }

    function testBuyTokensWithUpdate() public {
        // This test is only relevant when using MockPyth
        if (address(pythOracle) == address(0)) return;

        address tokenAddress = createTestToken();
        uint256 buyAmount = 2 ether;

        bytes[] memory updateData = createEthUpdate(3100);
        uint256 updateFee = pythOracle.getUpdateFee(updateData);
        uint256 totalPayment = buyAmount + updateFee;

        uint256 expectedTokens = launchpad.quoteTokens(
            tokenAddress,
            buyAmount,
            true
        );

        vm.prank(buyer1);
        launchpad.buyTokensWithUpdate{value: totalPayment}(
            tokenAddress,
            expectedTokens,
            updateData
        );

        uint256 finalBalance = InitialSupplySuperchainERC20(tokenAddress)
            .balanceOf(buyer1);
        assertGt(finalBalance, 0, "Should receive tokens with update");

        console.log("Tokens bought with update:", finalBalance);
    }

    function testSellTokens() public {
        // Create token and buy some first
        address tokenAddress = createTestToken();

        // Buy tokens first
        uint256 buyAmount = 3 ether;
        vm.prank(buyer1);
        launchpad.buyTokens{value: buyAmount}(tokenAddress, 0);

        uint256 tokenBalance = InitialSupplySuperchainERC20(tokenAddress)
            .balanceOf(buyer1);
        uint256 sellAmount = tokenBalance / 2; // Sell half

        // Approve tokens for sale
        vm.prank(buyer1);
        InitialSupplySuperchainERC20(tokenAddress).approve(
            address(launchpad),
            sellAmount
        );

        uint256 expectedEth = launchpad.quoteTokens(
            tokenAddress,
            sellAmount,
            false
        );
        uint256 initialEthBalance = buyer1.balance;

        vm.prank(buyer1);
        launchpad.sellTokens(tokenAddress, sellAmount, expectedEth);

        uint256 finalEthBalance = buyer1.balance;
        uint256 ethReceived = finalEthBalance - initialEthBalance;

        assertGt(ethReceived, 0, "Should receive ETH");
        assertApproxEqRel(
            ethReceived,
            expectedEth,
            0.01e18,
            "Should receive expected amount of ETH"
        );

        console.log("ETH received from sell:", ethReceived);
        console.log("Expected ETH:", expectedEth);
    }

    function testMarketCapThreshold() public {
        address tokenAddress = createTestToken();

        // Buy tokens to increase market cap
        uint256 buyAmount = 1 ether;

        // Multiple buyers to reach threshold
        for (uint i = 0; i < 5; i++) {
            address buyer = makeAddr(string(abi.encodePacked("buyer", i)));
            vm.deal(buyer, buyAmount + 1 ether);

            vm.prank(buyer);
            launchpad.buyTokens{value: buyAmount}(tokenAddress, 0);

            (, , , , , bool isLocked) = launchpad.getPoolInfo(tokenAddress);
            if (isLocked) {
                console.log("Pool locked after", i + 1, "purchases");
                break;
            }
        }

        (, , , , , bool locked) = launchpad.getPoolInfo(tokenAddress);
        assertTrue(
            locked,
            "Pool should be locked when market cap threshold is reached"
        );
    }

    function testTokenLaunch() public {
        if (block.number == 1) {
            console.log("Skipping testTokenLaunch in regular test environment");
            return;
        }

        // Create token and reach market cap threshold
        address tokenAddress = createTestToken();
        reachMarketCapThreshold(tokenAddress);

        // Check pool is locked
        (, , , , , bool locked) = launchpad.getPoolInfo(tokenAddress);
        assertTrue(locked, "Pool should be locked before launch");

        // Launch the token (only owner can launch)
        vm.prank(deployer);
        launchpad.launchToken{value: 1 ether}(tokenAddress);

        // Verify Uniswap V3 pool was created
        IUniswapV3Factory factory = IUniswapV3Factory(UNISWAP_V3_FACTORY);
        address poolAddress = factory.getPool(tokenAddress, WETH, 3000);

        assertTrue(
            poolAddress != address(0),
            "Uniswap V3 pool should be created"
        );

        // Verify token is launched (transfers should work now)
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(
            tokenAddress
        );

        // Try to transfer tokens between users (should work after launch)
        uint256 transferAmount = 1000 ether;
        if (token.balanceOf(address(launchpad)) >= transferAmount) {
            vm.prank(address(launchpad));
            token.transfer(buyer1, transferAmount);
            assertEq(
                token.balanceOf(buyer1),
                transferAmount,
                "Token transfers should work after launch"
            );
        }

        console.log("Token launched successfully");
        console.log("Uniswap V3 pool created at:", poolAddress);
    }

    function testPriceCalculations() public {
        address tokenAddress = createTestToken();

        launchpad.getPoolInfo(tokenAddress);

        // Test quote functions
        uint256 buyQuote = launchpad.quoteTokens(tokenAddress, 1 ether, true);
        uint256 sellQuote = launchpad.quoteTokens(
            tokenAddress,
            1000 ether,
            false
        );

        assertGt(buyQuote, 0, "Buy quote should be positive");
        assertGt(sellQuote, 0, "Sell quote should be positive");

        console.log("Buy quote for 1 ETH:", buyQuote);
        console.log("Sell quote for 1000 tokens:", sellQuote);
    }

    function testSellPenalty() public {
        address tokenAddress = createTestToken();

        // Use a smaller buy amount to avoid hitting market cap threshold
        uint256 buyAmount = 0.5 ether; // Reduced from 5 ether
        vm.prank(buyer1);
        launchpad.buyTokens{value: buyAmount}(tokenAddress, 0);

        // Verify pool is not locked
        (, , , , , bool locked) = launchpad.getPoolInfo(tokenAddress);
        assertFalse(locked, "Pool should not be locked yet");

        uint256 tokenBalance = InitialSupplySuperchainERC20(tokenAddress)
            .balanceOf(buyer1);

        // Approve and sell tokens
        vm.prank(buyer1);
        InitialSupplySuperchainERC20(tokenAddress).approve(
            address(launchpad),
            tokenBalance
        );

        uint256 initialEthBalance = buyer1.balance;

        vm.prank(buyer1);
        launchpad.sellTokens(tokenAddress, tokenBalance, 0);

        uint256 finalEthBalance = buyer1.balance;
        uint256 ethReceived = finalEthBalance - initialEthBalance;

        // Should receive less than buyAmount due to fees and sell penalty
        assertLt(
            ethReceived,
            buyAmount,
            "Should receive less due to fees and penalty"
        );

        console.log("ETH received after sell penalty:", ethReceived);
        console.log("Original buy amount:", buyAmount);
        console.log("Penalty applied (ETH):", buyAmount - ethReceived);
    }

    function testMarketCapCalculation() public {
        address tokenAddress = createTestToken();

        // Check initial market cap
        (uint256 ethReserve, uint256 tokenReserve, , , , ) = launchpad
            .getPoolInfo(tokenAddress);
        uint256 ethPrice = launchpad.getOraclePrice();

        console.log("=== Initial Pool State ===");
        console.log("ETH Reserve:", ethReserve);
        console.log("Token Reserve:", tokenReserve);
        console.log("ETH/USD Price:", ethPrice / 1e8);

        // Calculate initial token price and market cap
        uint256 tokenPriceInEth = (1 ether * ethReserve) / tokenReserve;
        uint256 totalMCapInEth = (launchpad.TOKEN_SUPPLY() * tokenPriceInEth) /
            1 ether;
        uint256 totalMCapInUsd = launchpad.ethToUsd(ethPrice, totalMCapInEth);

        console.log("Initial token price (wei per token):", tokenPriceInEth);
        console.log("Initial market cap (USD):", totalMCapInUsd);
        console.log(
            "Market cap threshold (USD):",
            launchpad.fakePoolMCapThreshold()
        );

        // Test with different buy amounts to see when threshold is reached
        uint256[] memory testAmounts = new uint256[](5);
        testAmounts[0] = 0.1 ether;
        testAmounts[1] = 0.5 ether;
        testAmounts[2] = 1 ether;
        testAmounts[3] = 5 ether;
        testAmounts[4] = 10 ether;

        for (uint i = 0; i < testAmounts.length; i++) {
            uint256 amount = testAmounts[i];
            console.log("=== Testing buy amount:", amount, "ETH ===");

            // Simulate the buy calculation
            uint256 fee = (amount * launchpad.txFee()) / 1000;
            uint256 ethAfterFee = amount - fee;
            uint256 tokensOut = launchpad.getAmountOut(
                ethAfterFee,
                ethReserve,
                tokenReserve
            );

            uint256 newEthReserve = ethReserve + ethAfterFee;
            uint256 newTokenReserve = tokenReserve - tokensOut;

            uint256 newTokenPrice = (1 ether * newEthReserve) / newTokenReserve;
            uint256 newMCapInEth = (launchpad.TOKEN_SUPPLY() * newTokenPrice) /
                1 ether;
            uint256 newMCapInUsd = launchpad.ethToUsd(ethPrice, newMCapInEth);

            console.log("New market cap (USD):", newMCapInUsd);
            console.log(
                "Would trigger threshold:",
                newMCapInUsd >= launchpad.fakePoolMCapThreshold()
            );
        }
    }

    function testAdminFunctions() public {
        // Test setting creation price
        vm.prank(deployer);
        launchpad.setCreationPrice(2);

        // Test setting fees
        vm.prank(deployer);
        launchpad.setTxFee(15); // 1.5%

        vm.prank(deployer);
        launchpad.setLaunchFee(25); // 2.5%

        // Test setting market cap threshold
        vm.prank(deployer);
        launchpad.setFakePoolMCapThreshold(100000); // $100k

        // Test setting Pyth oracle
        vm.prank(deployer);
        launchpad.setPythOracle(address(0x123));

        // Test setting price ID
        vm.prank(deployer);
        launchpad.setEthUsdPriceId(bytes32(uint256(0x456)));

        console.log("Admin functions working correctly");
    }

    function test_RevertWhenCreateTokenWithInvalidParams() public {
        uint256 creationFee = getCreationFee();

        // Test with sell penalty too high
        vm.prank(creator);
        vm.expectRevert("Sell penalty too high");
        launchpad.createToken{value: creationFee}(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            IMAGE_CID,
            DESCRIPTION,
            800, // 80% - too high
            0
        );
    }

    function test_RevertWhenBuyNonexistentToken() public {
        address fakeToken = makeAddr("fakeToken");

        vm.prank(buyer1);
        vm.expectRevert("Token not found");
        launchpad.buyTokens{value: 1 ether}(fakeToken, 0);
    }

    function test_RevertWhenLaunchUnlockedPool() public {
        address tokenAddress = createTestToken();

        // Try to launch without reaching market cap threshold
        vm.prank(deployer);
        vm.expectRevert("Pool not ready for launch");
        launchpad.launchToken{value: 1 ether}(tokenAddress);
    }

    function test_RevertWhenNonOwnerLaunch() public {
        address tokenAddress = createTestToken();
        reachMarketCapThreshold(tokenAddress);

        // Try to launch as non-owner
        vm.prank(creator);
        vm.expectRevert();
        launchpad.launchToken{value: 1 ether}(tokenAddress);
    }

    function testEmergencyWithdraw() public {
        uint256 contractBalance = address(launchpad).balance;
        uint256 initialBalance = deployer.balance;

        vm.prank(deployer);
        launchpad.emergencyWithdraw();

        assertEq(address(launchpad).balance, 0, "Contract balance should be 0");
        assertEq(
            deployer.balance,
            initialBalance + contractBalance,
            "Deployer should receive contract balance"
        );
    }

    function test_RevertWhenSellPenaltyTooHigh() public {
        vm.prank(creator);
        vm.expectRevert("Sell penalty too high");
        launchpad.createToken{value: 1 ether}(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            IMAGE_CID,
            DESCRIPTION,
            201, // 20.1% - too high
            0
        );
    }

    // Helper functions
    function getCreationFee() internal view returns (uint256) {
        uint256 ethPrice = launchpad.getOraclePrice();
        return launchpad.usdToEth(ethPrice, launchpad.creationPrice());
    }

    function createTestToken() internal returns (address) {
        uint256 creationFee = getCreationFee();
        uint256 initialBuy = 0.5 ether;

        vm.recordLogs();

        vm.prank(creator);
        launchpad.createToken{value: creationFee + initialBuy}(
            TOKEN_NAME,
            TOKEN_SYMBOL,
            IMAGE_CID,
            DESCRIPTION,
            SELL_PENALTY,
            initialBuy
        );

        return getLastCreatedToken();
    }

    function getLastCreatedToken() internal returns (address) {
        Vm.Log[] memory logs = vm.getRecordedLogs();

        for (uint i = 0; i < logs.length; i++) {
            if (
                logs[i].topics[0] ==
                keccak256(
                    "TokenCreated(address,address,uint256,string,string,string,string,uint256)"
                )
            ) {
                return address(uint160(uint256(logs[i].topics[2])));
            }
        }

        revert("Token creation event not found");
    }

    function reachMarketCapThreshold(address tokenAddress) internal {
        // Buy enough tokens to reach the market cap threshold
        uint256 buyAmount = 15 ether;

        for (uint i = 0; i < 8; i++) {
            address buyer = makeAddr(
                string(abi.encodePacked("thresholdBuyer", i))
            );
            vm.deal(buyer, buyAmount + 1 ether);

            vm.prank(buyer);
            launchpad.buyTokens{value: buyAmount}(tokenAddress, 0);

            (, , , , , bool locked) = launchpad.getPoolInfo(tokenAddress);
            if (locked) {
                console.log(
                    "Market cap threshold reached after",
                    i + 1,
                    "purchases"
                );
                break;
            }
        }
    }

    // Helper function for creating ETH price update data (MockPyth only)
    function createEthUpdate(
        int64 ethPrice
    ) private view returns (bytes[] memory) {
        if (address(pythOracle) == address(0)) {
            // Return empty array if not using MockPyth
            bytes[] memory emptyArray = new bytes[](0);
            return emptyArray;
        }

        bytes[] memory updateData = new bytes[](1);
        updateData[0] = pythOracle.createPriceFeedUpdateData(
            ETH_USD_PRICE_ID,
            ethPrice * 100000000, // price (8 decimals)
            10 * 100000000, // confidence
            -8, // exponent
            ethPrice * 100000000, // emaPrice
            10 * 100000000, // emaConfidence
            uint64(block.timestamp), // publishTime
            uint64(block.timestamp) // prevPublishTime
        );

        return updateData;
    }
}
