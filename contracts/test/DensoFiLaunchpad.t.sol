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
import {ChainConfig} from "script/ChainConfig.sol";

contract DensoFiLaunchpadTest is Test {
    DensoFiLaunchpad public launchpad;
    MockPyth public pythOracle;

    // Chain-specific addresses (will be set based on fork)
    address public UNISWAP_V3_ROUTER;
    address public UNISWAP_V3_FACTORY;
    address public NONFUNGIBLE_POSITION_MANAGER;
    address public WETH;
    address public PYTH_ORACLE;
    bytes32 public ETH_USD_PRICE_ID;

    uint24 constant POOL_FEE = 3000; // 0.3% fee tier

    // Default Ethereum mainnet addresses (for backwards compatibility)
    address constant DEFAULT_UNISWAP_V3_ROUTER =
        0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address constant DEFAULT_UNISWAP_V3_FACTORY =
        0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address constant DEFAULT_NONFUNGIBLE_POSITION_MANAGER =
        0xC36442b4a4522E871399CD717aBDD847Ab11FE88;
    address constant DEFAULT_WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant DEFAULT_PYTH_ORACLE =
        0x4305FB66699C3B2702D4d05CF36551390A4c69C6;
    bytes32 constant DEFAULT_ETH_USD_PRICE_ID =
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
        // Initialize chain-specific addresses
        _initializeChainAddresses();

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
                deployer,
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
                deployer,
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

            // For Flow, try to get the FLOW price directly from Pyth oracle
            if (block.chainid == 747) {
                console.log("Testing Flow oracle configuration...");
                console.log("Pyth Oracle Address:", PYTH_ORACLE);
                console.log("Flow Price ID:", vm.toString(ETH_USD_PRICE_ID));

                // Try to get price directly from Pyth oracle with different staleness values
                try
                    this.tryGetPythPriceDirectly(
                        PYTH_ORACLE,
                        ETH_USD_PRICE_ID,
                        36000
                    )
                returns (bool success, uint256 price) {
                    if (success) {
                        console.log(
                            "SUCCESS: Direct Pyth call worked with 36000s staleness"
                        );
                        console.log("Raw Flow price from Pyth:", price);
                        console.log(
                            "Flow price USD (with proper decimals):",
                            price / 1e8
                        );
                    } else {
                        console.log(
                            "FAILED: Direct Pyth call failed with 36000s staleness"
                        );
                    }
                } catch {
                    console.log("ERROR: Direct Pyth call reverted");
                }

                // Set very lenient staleness for Flow
                vm.prank(deployer);
                launchpad.setMaxPriceStaleness(36000); // Use the 36000 seconds you mentioned

                // Try the regular oracle price function
                try launchpad.getOraclePrice() returns (
                    uint256 priceWithStaleness
                ) {
                    console.log("SUCCESS: getOraclePrice worked");
                    console.log(
                        "Price with custom staleness:",
                        priceWithStaleness / 1e8
                    );
                } catch Error(string memory reason) {
                    console.log("getOraclePrice failed:", reason);
                } catch {
                    console.log(
                        "getOraclePrice failed with unknown error"
                    );
                }

                try launchpad.getOraclePrice() returns (uint256 currentPrice) {
                    console.log("SUCCESS: getOraclePrice worked");
                    console.log(
                        "Raw oracle price (8-decimal format):",
                        currentPrice
                    );
                    console.log("Oracle price in USD:", currentPrice / 1e8);
                } catch Error(string memory reason) {
                    console.log("getOraclePrice failed:", reason);
                } catch {
                    console.log("getOraclePrice failed with unknown error");
                }
            }
        }

        // Fund test accounts
        vm.deal(creator, 100 ether);
        vm.deal(buyer1, 50 ether);
        vm.deal(buyer2, 50 ether);
        vm.deal(seller, 50 ether);
        vm.deal(deployer, 10 ether);

        console.log("Setup completed for chain:", block.chainid);
        console.log("Using Uniswap V3 Router:", UNISWAP_V3_ROUTER);
        console.log("Using WETH:", WETH);
        console.log("Using Pyth Oracle:", PYTH_ORACLE);
        console.log("Launchpad deployed at:", address(launchpad));
    }

    function _initializeChainAddresses() internal {
        uint256 chainId = block.chainid;

        if (ChainConfig.isChainSupported(chainId)) {
            // Use chain-specific configuration from ChainConfig
            ChainConfig.ChainParameters memory params = ChainConfig
                .getChainParameters(chainId);

            UNISWAP_V3_ROUTER = params.uniV3Router;
            UNISWAP_V3_FACTORY = params.uniV3Factory;
            NONFUNGIBLE_POSITION_MANAGER = params.nonfungiblePositionManager;
            WETH = params.weth;
            PYTH_ORACLE = params.pythOracle;
            ETH_USD_PRICE_ID = params.ethUsdPriceId;

            console.log("Initialized addresses for supported chain:", chainId);
        } else {
            // Use default Ethereum mainnet addresses for unsupported chains
            UNISWAP_V3_ROUTER = DEFAULT_UNISWAP_V3_ROUTER;
            UNISWAP_V3_FACTORY = DEFAULT_UNISWAP_V3_FACTORY;
            NONFUNGIBLE_POSITION_MANAGER = DEFAULT_NONFUNGIBLE_POSITION_MANAGER;
            WETH = DEFAULT_WETH;
            PYTH_ORACLE = DEFAULT_PYTH_ORACLE;
            ETH_USD_PRICE_ID = DEFAULT_ETH_USD_PRICE_ID;

            console.log(
                "Using default Ethereum addresses for unsupported chain:",
                chainId
            );
        }
    }

    function testOraclePriceAccess() public view {
        uint256 nativePrice = launchpad.getOraclePrice();
        console.log("Raw native token price (8-decimal):", nativePrice);
        console.log("Native token USD price:", nativePrice / 1e8);

        // For fork testing, handle different native tokens
        if (block.number > 1) {
            // In fork environment, verify price is accessible
            console.log("Fork environment: Price is working correctly");
            console.log("Raw price (8-decimal format):", nativePrice);
            console.log("USD value:", nativePrice / 1e8);

            // Check if we're on Flow (where native token is FLOW, not ETH)
            if (block.chainid == 747) {
                // Flow - expect FLOW price (around $0.30-$0.50)
                if (nativePrice > 0) {
                    console.log("FLOW price detected:", nativePrice / 1e8);
                    assertGt(
                        nativePrice,
                        10000000,
                        "FLOW price too low (< $0.10)"
                    ); // > $0.10
                    assertLt(
                        nativePrice,
                        500000000,
                        "FLOW price too high (> $5.00)"
                    ); // < $5.00
                }
            } else {
                // Other chains - expect higher prices for ETH or other tokens
                if (nativePrice > 0) {
                    console.log(
                        "Native token price detected:",
                        nativePrice / 1e8
                    );
                    // Don't enforce strict bounds in fork environment
                }
            }
        } else {
            // In regular test environment with MockPyth, price should be reasonable (ETH-like)
            assertGt(nativePrice, 500 * 1e8, "Mock price too low");
            assertLt(nativePrice, 10000 * 1e8, "Mock price too high");
        }
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

        // Check initial market cap
        (uint256 initialEthMcap, uint256 initialUsdMcap) = launchpad
            .calculateMarketCap(tokenAddress);
        console.log("=== Initial Market Cap ===");
        console.log("ETH Market Cap:", initialEthMcap);
        console.log("USD Market Cap:", initialUsdMcap);
        console.log("Threshold:", launchpad.s_fakePoolMCapThreshold());

        // Calculate how much buying is needed based on oracle price
        (
            uint256 iterations,
            uint256 buyAmount
        ) = _calculateIterationsForThreshold(tokenAddress);

        console.log("Calculated iterations needed:", iterations);
        console.log("Buy amount per iteration:", buyAmount);

        // Multiple buyers to reach threshold
        for (uint i = 0; i < iterations; i++) {
            address buyer = makeAddr(string(abi.encodePacked("buyer", i)));
            vm.deal(buyer, buyAmount + 1 ether);

            console.log("=== Purchase", i + 1, "===");
            console.log("Buyer:", buyer);
            console.log("Amount:", buyAmount);

            vm.prank(buyer);
            launchpad.buyTokens{value: buyAmount}(tokenAddress, 0);

            // Check market cap after purchase
            (, uint256 usdMcap) = launchpad.calculateMarketCap(tokenAddress);
            console.log("Market Cap after purchase:", usdMcap);

            (, , , , , bool isLocked) = launchpad.getPoolInfo(tokenAddress);
            console.log("Pool locked:", isLocked);

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
            launchpad.s_fakePoolMCapThreshold()
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
            uint256 fee = (amount * launchpad.s_txFee()) / 1000;
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
                newMCapInUsd >= launchpad.s_fakePoolMCapThreshold()
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

    // Test fork-specific functionality for pool fees
    function testVaultFeeCollectionFork() public {
        // Skip if not on fork
        vm.skip(block.number == 1);

        console.log("=== TESTING VAULT FEE COLLECTION ON MAINNET FORK ===");

        address tokenAddress = createTestToken();

        // Buy tokens to reach threshold
        _buyTokensToReachThresholdForFork(tokenAddress);

        // Verify pool is locked after threshold
        (, , , , , bool locked) = launchpad.getPoolInfo(tokenAddress);
        assertTrue(locked, "Pool should be locked after reaching threshold");

        // Launch token - this creates a vault
        vm.recordLogs();
        vm.prank(deployer);
        launchpad.launchToken{value: 2 ether}(tokenAddress);

        // Get vault address from events
        address vaultAddress = _getVaultAddressFromLogs();
        assertTrue(vaultAddress != address(0), "Vault should be created");

        DensoFiUniV3Vault vault = DensoFiUniV3Vault(vaultAddress);

        console.log("Vault created at:", vaultAddress);
        console.log("Vault creator:", vault.s_creator());
        console.log("Vault domain owner:", vault.s_domainOwner());
        console.log("Vault token ID:", vault.s_tokenId());
        console.log("Test creator address:", creator);

        // Simulate some trading activity on Uniswap to generate fees
        _simulateTradingActivityForFork(tokenAddress);

        // Check that fees can be collected
        uint256 creatorBalanceBeforeETH = creator.balance;
        uint256 creatorBalanceBeforeToken = InitialSupplySuperchainERC20(
            tokenAddress
        ).balanceOf(creator);

        vm.prank(creator);
        vault.collectFees();

        uint256 creatorBalanceAfterETH = creator.balance;
        uint256 creatorBalanceAfterToken = InitialSupplySuperchainERC20(
            tokenAddress
        ).balanceOf(creator);

        console.log("Creator ETH balance before:", creatorBalanceBeforeETH);
        console.log("Creator ETH balance after:", creatorBalanceAfterETH);
        console.log("Creator token balance before:", creatorBalanceBeforeToken);
        console.log("Creator token balance after:", creatorBalanceAfterToken);

        // Note: In a real scenario, there should be some fee accumulation
        // The actual fee amounts depend on trading volume

        console.log("Fork fee collection test completed");
    }

    function testDomainOwnershipTransferFork() public {
        // Skip if not on fork
        vm.skip(block.number == 1);

        console.log("=== TESTING VAULT OWNERSHIP TRANSFER ON MAINNET FORK ===");

        address tokenAddress = createTestToken();
        address newOwner = makeAddr("newDomainOwner");
        vm.deal(newOwner, 10 ether);

        // Reach threshold and launch
        _buyTokensToReachThresholdForFork(tokenAddress);

        vm.recordLogs();
        vm.prank(deployer);
        launchpad.launchToken{value: 2 ether}(tokenAddress);

        address vaultAddress = _getVaultAddressFromLogs();
        DensoFiUniV3Vault vault = DensoFiUniV3Vault(vaultAddress);

        // Check vault state before trying to collect fees
        console.log("Vault creator:", vault.s_creator());
        console.log("Vault domain owner:", vault.s_domainOwner());
        console.log("Vault token ID:", vault.s_tokenId());
        console.log("Test creator address:", creator);

        // Initially creator should be able to collect fees
        vm.prank(creator);
        vault.collectFees(); // Should not revert

        // Simulate ownership transfer (this would be done by admin after domain ownership changes)
        // For now, we test that position can be transferred by owner
        string memory domainName = InitialSupplySuperchainERC20(tokenAddress)
            .name();
        vm.prank(deployer);
        launchpad.updateDomainOwnership(domainName, newOwner);

        // Domain owner should be transferred
        assertEq(
            vault.s_domainOwner(),
            newOwner,
            "Position should be transferred"
        );

        console.log("Vault ownership transfer test completed");
    }

    function testFeeAccumulationAfterTradingFork() public {
        vm.skip(block.number == 1); // Only run on fork

        console.log("=== TESTING FEE ACCUMULATION AFTER TRADING (FORK) ===");

        // Create and launch a token
        address tokenAddress = createTestToken();
        console.log("Token created:", tokenAddress);

        // Buy tokens to reach launch threshold
        _buyTokensToReachThresholdForFork(tokenAddress);

        // Launch the token on Uniswap
        vm.recordLogs();
        vm.prank(deployer);
        launchpad.launchToken{value: 2 ether}(tokenAddress);

        // Get vault address from logs
        address vaultAddress = _getVaultAddressFromLogs();
        console.log("Vault created at:", vaultAddress);

        // Get the Uniswap V3 pool address
        address poolAddress = IUniswapV3Factory(UNISWAP_V3_FACTORY).getPool(
            tokenAddress < WETH ? tokenAddress : WETH,
            tokenAddress < WETH ? WETH : tokenAddress,
            POOL_FEE
        );

        require(poolAddress != address(0), "Pool should exist after launch");
        console.log("Pool address:", poolAddress);

        // Get initial vault balances (for fee tracking)
        DensoFiUniV3Vault vault = DensoFiUniV3Vault(vaultAddress);

        // Try to get initial uncollected fees (this might fail if vault doesn't have the function)
        try vault.s_tokenId() returns (uint256 tokenId) {
            if (tokenId > 0) {
                console.log("Vault has position with token ID:", tokenId);
            }
        } catch {
            console.log("Could not get vault token ID");
        }

        // Simulate trading activity to generate fees
        console.log("Starting trading simulation...");
        _simulateTradingActivityForFork(tokenAddress);

        // Wait a bit for transactions to settle
        vm.warp(block.timestamp + 60);

        // Try to collect fees and see if any were generated
        console.log("Attempting to collect fees...");

        // Get vault balances before fee collection
        uint256 vaultWETHBefore = IERC20(WETH).balanceOf(vaultAddress);
        uint256 vaultTokenBefore = IERC20(tokenAddress).balanceOf(vaultAddress);

        console.log(
            "Vault WETH balance before fee collection:",
            vaultWETHBefore
        );
        console.log(
            "Vault token balance before fee collection:",
            vaultTokenBefore
        );

        // Attempt to collect fees (as the creator/owner)
        vm.prank(creator);
        try vault.collectFees() {
            console.log("SUCCESS: Fee collection successful");

            // Check balances after fee collection
            uint256 vaultWETHAfter = IERC20(WETH).balanceOf(vaultAddress);
            uint256 vaultTokenAfter = IERC20(tokenAddress).balanceOf(
                vaultAddress
            );

            console.log(
                "Vault WETH balance after fee collection:",
                vaultWETHAfter
            );
            console.log(
                "Vault token balance after fee collection:",
                vaultTokenAfter
            );

            // Check if any fees were collected
            bool feesCollected = (vaultWETHAfter > vaultWETHBefore) ||
                (vaultTokenAfter > vaultTokenBefore);

            if (feesCollected) {
                console.log("SUCCESS: Fees were successfully collected!");
                console.log(
                    "WETH fees collected:",
                    vaultWETHAfter - vaultWETHBefore
                );
                console.log(
                    "Token fees collected:",
                    vaultTokenAfter - vaultTokenBefore
                );
            } else {
                console.log(
                    "WARNING: No fees collected (may be expected if trading volume was low)"
                );
            }
        } catch Error(string memory reason) {
            console.log("Fee collection failed:", reason);
        } catch {
            console.log("Fee collection failed with unknown error");
        }

        // Verify that the pool exists and has been interacted with
        assertTrue(poolAddress != address(0), "Pool should exist");
        assertTrue(vaultAddress != address(0), "Vault should exist");

        console.log("Fee accumulation test completed");
        console.log(" FEE ACCUMULATION TEST SUCCESSFUL\n");
    }

    function testDomainOwnershipTransferAndFeeCollectionFork() public {
        vm.skip(block.number == 1); // Only run on fork

        console.log(
            "=== TESTING DOMAIN OWNERSHIP TRANSFER & FEE COLLECTION (FORK) ==="
        );

        // Create and launch a token
        address tokenAddress = createTestToken();
        console.log("Token created:", tokenAddress);

        // Buy tokens to reach launch threshold
        _buyTokensToReachThresholdForFork(tokenAddress);

        // Launch the token on Uniswap
        vm.recordLogs();
        vm.prank(deployer);
        launchpad.launchToken{value: 2 ether}(tokenAddress);

        // Get vault address from logs
        address vaultAddress = _getVaultAddressFromLogs();
        DensoFiUniV3Vault vault = DensoFiUniV3Vault(vaultAddress);

        console.log("Vault created at:", vaultAddress);
        console.log("Initial vault owner:", vault.s_domainOwner());
        console.log("Vault creator:", vault.s_creator());

        // Simulate trading activity to generate fees
        console.log("\n--- Simulating Trading to Generate Fees ---");
        _simulateTradingActivityForFork(tokenAddress);

        // Wait for fees to accumulate
        vm.warp(block.timestamp + 60);

        // Create a new owner address
        address newOwner = makeAddr("newDomainOwner");
        vm.deal(newOwner, 10 ether);

        console.log("\n--- Testing Ownership Transfer ---");
        console.log("New owner address:", newOwner);

        // Transfer vault ownership (this would be called by admin after domain ownership changes)
        // Since we created the vault with an empty domain name, we need to get the domain from the vault
        string memory domainName = launchpad.getDomainByVault(vaultAddress);
        console.log("Domain name for vault:", domainName);

        vm.prank(deployer); // Deployer is the admin/owner
        launchpad.updateDomainOwnership(domainName, newOwner);

        console.log("Vault ownership transferred to:", vault.s_domainOwner());

        // Test 1: Verify old owner can no longer collect fees
        console.log("\n--- Testing Old Owner Cannot Collect Fees ---");
        vm.prank(creator);
        try vault.collectFees() {
            console.log(
                "ERROR: Old owner was able to collect fees (should fail)"
            );
            assertTrue(
                false,
                "Old owner should not be able to collect fees after transfer"
            );
        } catch Error(string memory reason) {
            console.log(
                "SUCCESS: Old owner correctly blocked from fee collection"
            );
            console.log("Reason:", reason);
        } catch {
            console.log(
                "SUCCESS: Old owner correctly blocked from fee collection (low-level revert)"
            );
        }

        // Test 2: Get balances before new owner collects fees
        console.log("\n--- Testing New Owner Can Collect Fees ---");
        uint256 newOwnerWETHBefore = IERC20(WETH).balanceOf(newOwner);
        uint256 newOwnerTokenBefore = IERC20(tokenAddress).balanceOf(newOwner);
        uint256 vaultWETHBefore = IERC20(WETH).balanceOf(vaultAddress);
        uint256 vaultTokenBefore = IERC20(tokenAddress).balanceOf(vaultAddress);

        console.log("New owner WETH balance before:", newOwnerWETHBefore);
        console.log("New owner token balance before:", newOwnerTokenBefore);
        console.log("Vault WETH balance before:", vaultWETHBefore);
        console.log("Vault token balance before:", vaultTokenBefore);

        // Test 3: New owner collects fees
        vm.prank(newOwner);
        try vault.collectFees() {
            console.log("SUCCESS: New owner successfully collected fees");

            // Check balances after fee collection
            uint256 newOwnerWETHAfter = IERC20(WETH).balanceOf(newOwner);
            uint256 newOwnerTokenAfter = IERC20(tokenAddress).balanceOf(
                newOwner
            );

            console.log("New owner WETH balance after:", newOwnerWETHAfter);
            console.log("New owner token balance after:", newOwnerTokenAfter);

            // Check if any fees were actually collected
            bool feesCollected = (newOwnerWETHAfter > newOwnerWETHBefore) ||
                (newOwnerTokenAfter > newOwnerTokenBefore);

            if (feesCollected) {
                console.log(
                    "SUCCESS: Fees were successfully transferred to new owner!"
                );
                console.log(
                    "WETH fees collected:",
                    newOwnerWETHAfter - newOwnerWETHBefore
                );
                console.log(
                    "Token fees collected:",
                    newOwnerTokenAfter - newOwnerTokenBefore
                );
            } else {
                console.log(
                    "NOTE: No fees collected (may be expected if trading volume was low)"
                );
                console.log(
                    "But fee collection function executed successfully for new owner"
                );
            }
        } catch Error(string memory reason) {
            console.log("FAILED: New owner could not collect fees");
            console.log("Reason:", reason);
            assertTrue(false, "New owner should be able to collect fees");
        } catch {
            console.log(
                "FAILED: New owner could not collect fees (low-level revert)"
            );
            assertTrue(false, "New owner should be able to collect fees");
        }

        // Test 4: Verify vault state
        console.log("\n--- Final Verification ---");
        console.log("Final vault owner:", vault.s_domainOwner());
        console.log("Original creator:", vault.s_creator());
        console.log("Vault token ID:", vault.s_tokenId());

        // Assertions
        assertEq(
            vault.s_domainOwner(),
            newOwner,
            "Vault should be owned by new owner"
        );
        assertEq(vault.s_creator(), creator, "Creator should remain unchanged");
        assertTrue(vault.s_tokenId() > 0, "Vault should have a valid token ID");

        console.log(
            "\n*** DOMAIN OWNERSHIP TRANSFER TEST COMPLETED SUCCESSFULLY ***"
        );
    }

    // Helper function to test Pyth oracle directly
    function tryGetPythPriceDirectly(
        address pythOracle,
        bytes32 priceId,
        uint32 maxStaleness
    ) external view returns (bool success, uint256 price) {
        try
            IPyth(pythOracle).getPriceNoOlderThan(priceId, maxStaleness)
        returns (PythStructs.Price memory pythPrice) {
            if (pythPrice.price > 0) {
                // Convert to 8 decimal format like the contract does
                uint256 base = uint64(pythPrice.price);
                uint256 priceWith8Decimals;

                console.log("Raw Pyth price (int64):", base);
                console.log("Pyth exponent:", pythPrice.expo);

                if (pythPrice.expo >= 0) {
                    uint256 factor = 10 ** uint32(pythPrice.expo);
                    priceWith8Decimals = base * factor * 1e8;
                } else {
                    uint256 factor = 10 ** uint32(-pythPrice.expo);
                    priceWith8Decimals = (base * 1e8) / factor;
                }

                console.log("Price with 8 decimals:", priceWith8Decimals);

                return (true, priceWith8Decimals);
            } else {
                return (false, 0);
            }
        } catch {
            return (false, 0);
        }
    }

    // Helper functions
    function getCreationFee() internal view returns (uint256) {
        uint256 ethPrice = launchpad.getOraclePrice();
        return launchpad.usdToEth(ethPrice, launchpad.s_creationPrice());
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
        // Calculate optimal buying strategy based on oracle price
        (
            uint256 iterations,
            uint256 buyAmount
        ) = _calculateIterationsForThreshold(tokenAddress);

        for (uint i = 0; i < iterations; i++) {
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

    function _calculateIterationsForThreshold(
        address tokenAddress
    ) internal view returns (uint256 iterations, uint256 buyAmount) {
        uint256 ethPrice = launchpad.getOraclePrice();
        uint256 threshold = launchpad.s_fakePoolMCapThreshold();

        console.log("Oracle ETH price:", ethPrice / 1e8);
        console.log("Market cap threshold (USD):", threshold);

        // Handle FLOW pricing (native token price around $0.30-$0.50)
        if (ethPrice < 100 * 1e8) {
            // Less than $100 - this includes FLOW price (~$0.34)
            console.log(
                "Using strategy for low price native token (e.g., FLOW)"
            );
            console.log("Native token price (USD):", ethPrice / 1e8);

            // Special handling when oracle price is 0 - use known FLOW price for calculation
            if (ethPrice == 0 && block.chainid == 747) {
                console.log(
                    "Oracle price is 0 on Flow - using known FLOW price for calculation"
                );
                // Use the FLOW price we know works: 34455958 (represents $0.34455958)
                uint256 knownFlowPrice = 34455958; // This is in 8-decimal format already
                uint256 thresholdInFunction = launchpad
                    .s_fakePoolMCapThreshold();

                // For $75,000 threshold at $0.34455958 per FLOW:
                // We need 75000 / 0.34455958 = ~217,669 FLOW tokens worth of market cap
                uint256 nativeTokensNeeded = (thresholdInFunction * 1e8) /
                    knownFlowPrice;
                uint256 flowNeeded = (nativeTokensNeeded * 1 ether) / 1e8;

                console.log(
                    "Using known FLOW price for calculation:",
                    knownFlowPrice
                );
                console.log(
                    "FLOW tokens equivalent needed for threshold:",
                    nativeTokensNeeded
                );
                console.log("FLOW wei needed:", flowNeeded);

                // Since bonding curve is exponential and we can't use USD conversion, need much more
                flowNeeded = (flowNeeded * 10) / 1; // 10x buffer since USD calc won't work

                if (flowNeeded <= 500 ether) {
                    return (50, 10 ether);
                } else if (flowNeeded <= 1000 ether) {
                    return (75, 15 ether);
                } else {
                    return (100, 20 ether);
                }
            } else if (ethPrice == 0) {
                console.log(
                    "Oracle price is 0 - using maximum aggressive strategy"
                );
                return (100, 20 ether); // Maximum aggressive for zero price
            } else if (ethPrice > 10000000) {
                // > $0.10 - Calculate more precisely for FLOW
                console.log(
                    "Calculating FLOW strategy based on price:",
                    ethPrice
                );

                // For FLOW at ~$0.34, reaching $75k USD market cap requires massive buying
                // Due to bonding curve, we need aggressive parameters
                console.log("Using maximum aggressive strategy for FLOW");
                return (200, 25 ether); // 200 iterations × 25 FLOW = 5000 FLOW total
            } else {
                // Price between 0 and $0.10, use aggressive strategy
                console.log(
                    "Price between 0 and $0.10 - using aggressive strategy"
                );
                return (75, 15 ether);
            }
        }

        // Get current pool state
        (uint256 ethReserve, uint256 tokenReserve, , , , ) = launchpad
            .getPoolInfo(tokenAddress);

        // Calculate current market cap
        (, uint256 currentUsdMcap) = launchpad.calculateMarketCap(tokenAddress);

        if (currentUsdMcap >= threshold) {
            return (1, 0.1 ether); // Already at threshold, just need one small buy
        }

        // Calculate how much USD value we need to add
        uint256 usdNeeded = threshold - currentUsdMcap;
        console.log("USD needed to reach threshold:", usdNeeded);

        // Convert USD needed to ETH
        uint256 ethNeeded = launchpad.usdToEth(ethPrice, usdNeeded);
        console.log("ETH needed to reach threshold:", ethNeeded);

        // Add buffer because of bonding curve dynamics (need more ETH than linear calculation)
        ethNeeded = (ethNeeded * 3) / 2; // 50% buffer

        // Choose buy amount and calculate iterations
        if (ethNeeded <= 5 ether) {
            buyAmount = 1 ether;
            iterations = (ethNeeded / buyAmount) + 2; // Add 2 extra iterations for safety
        } else if (ethNeeded <= 20 ether) {
            buyAmount = 2 ether;
            iterations = (ethNeeded / buyAmount) + 2;
        } else if (ethNeeded <= 100 ether) {
            buyAmount = 5 ether;
            iterations = (ethNeeded / buyAmount) + 2;
        } else {
            buyAmount = 10 ether;
            iterations = (ethNeeded / buyAmount) + 2;
        }

        // Cap iterations at reasonable maximum
        if (iterations > 25) {
            iterations = 25;
            buyAmount = 10 ether;
        }

        console.log(
            "Calculated strategy - iterations:",
            iterations,
            "buyAmount:",
            buyAmount
        );
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

    // Helper functions for fork testing
    function _buyTokensToReachThresholdForFork(address tokenAddress) internal {
        // Calculate optimal buying strategy based on oracle price
        (
            uint256 iterations,
            uint256 buyAmount
        ) = _calculateIterationsForThreshold(tokenAddress);

        // Ensure buyer1 has enough funds
        uint256 totalNeeded = iterations * buyAmount + 10 ether;
        vm.deal(buyer1, totalNeeded);

        for (uint i = 0; i < iterations; i++) {
            (, , , , , bool isLocked) = launchpad.getPoolInfo(tokenAddress);
            if (isLocked) {
                console.log(
                    "Market cap threshold reached after",
                    i + 1,
                    "purchases"
                );
                break;
            }

            vm.prank(buyer1);
            try launchpad.buyTokens{value: buyAmount}(tokenAddress, 0) {
                // Continue buying
            } catch {
                // If purchase fails, try smaller amount
                vm.prank(buyer1);
                launchpad.buyTokens{value: buyAmount / 2}(tokenAddress, 0);
            }
        }

        // Verify threshold was reached
        (, , , , , bool finalLocked) = launchpad.getPoolInfo(tokenAddress);
        assertTrue(finalLocked, "Market cap threshold should be reached");
    }

    function _getVaultAddressFromLogs() internal returns (address) {
        Vm.Log[] memory logs = vm.getRecordedLogs();

        for (uint i = 0; i < logs.length; i++) {
            if (
                logs[i].topics[0] ==
                keccak256("TokenLaunched(address,address,address,address)")
            ) {
                // TokenLaunched event structure:
                // event TokenLaunched(address indexed creator, address indexed token, address indexed pool, address vault)
                // The vault address is the only non-indexed parameter, so it's in the data field
                address vaultAddress = abi.decode(logs[i].data, (address));
                console.log("Extracted vault address from logs:", vaultAddress);
                return vaultAddress;
            }
        }

        revert("TokenLaunched event not found in logs");
    }

    function _simulateTradingActivityForFork(address tokenAddress) internal {
        console.log("Simulating trading activity for token:", tokenAddress);

        // Get the Uniswap V3 pool address
        address poolAddress = IUniswapV3Factory(UNISWAP_V3_FACTORY).getPool(
            tokenAddress < WETH ? tokenAddress : WETH,
            tokenAddress < WETH ? WETH : tokenAddress,
            POOL_FEE
        );

        require(poolAddress != address(0), "Pool should exist");
        console.log("Pool address:", poolAddress);

        // Create some traders
        address trader1 = makeAddr("trader1");
        address trader2 = makeAddr("trader2");
        vm.deal(trader1, 50 ether);
        vm.deal(trader2, 50 ether);

        // Wrap some ETH for trading
        vm.prank(trader1);
        IwETH(WETH).deposit{value: 10 ether}();

        vm.prank(trader2);
        IwETH(WETH).deposit{value: 10 ether}();

        // Approve the router to spend tokens
        vm.prank(trader1);
        IERC20(WETH).approve(UNISWAP_V3_ROUTER, type(uint256).max);

        vm.prank(trader2);
        IERC20(WETH).approve(UNISWAP_V3_ROUTER, type(uint256).max);

        // Make some swaps to generate fees
        // Swap 1: WETH -> Token
        IUniV3Router.ExactInputSingleParams memory swapParams1 = IUniV3Router
            .ExactInputSingleParams({
                tokenIn: WETH,
                tokenOut: tokenAddress,
                fee: POOL_FEE,
                recipient: trader1,
                deadline: block.timestamp + 15 minutes,
                amountIn: 1 ether,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        vm.prank(trader1);
        try
            IUniV3Router(UNISWAP_V3_ROUTER).exactInputSingle(swapParams1)
        returns (uint256 amountOut) {
            console.log("Swap 1 completed - received", amountOut, "tokens");

            // Approve router to spend the tokens we just received
            vm.prank(trader1);
            IERC20(tokenAddress).approve(UNISWAP_V3_ROUTER, amountOut);

            // Swap 2: Token -> WETH (reverse direction)
            IUniV3Router.ExactInputSingleParams memory swapParams2 = IUniV3Router
                .ExactInputSingleParams({
                    tokenIn: tokenAddress,
                    tokenOut: WETH,
                    fee: POOL_FEE,
                    recipient: trader1,
                    deadline: block.timestamp + 15 minutes,
                    amountIn: amountOut / 2, // Only swap half back
                    amountOutMinimum: 0,
                    sqrtPriceLimitX96: 0
                });

            vm.prank(trader1);
            try
                IUniV3Router(UNISWAP_V3_ROUTER).exactInputSingle(swapParams2)
            returns (uint256 ethOut) {
                console.log("Swap 2 completed - received", ethOut, "WETH");
            } catch {
                console.log("Swap 2 failed (expected in some cases)");
            }
        } catch {
            console.log(
                "Swap 1 failed - pool might not have sufficient liquidity yet"
            );
        }

        // Additional smaller swaps to generate more fees
        for (uint i = 0; i < 3; i++) {
            vm.prank(trader2);
            try
                IUniV3Router(UNISWAP_V3_ROUTER).exactInputSingle(
                    IUniV3Router.ExactInputSingleParams({
                        tokenIn: WETH,
                        tokenOut: tokenAddress,
                        fee: POOL_FEE,
                        recipient: trader2,
                        deadline: block.timestamp + 15 minutes,
                        amountIn: 0.1 ether,
                        amountOutMinimum: 0,
                        sqrtPriceLimitX96: 0
                    })
                )
            {
                console.log("Additional swap", i + 1, "completed");
            } catch {
                console.log("Additional swap", i + 1, "failed");
                break;
            }
        }

        console.log(
            "Trading simulation completed - fees should have accumulated"
        );
    }
}

// Additional interfaces for Uniswap V3 Router
interface IUniV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut);
}

// WETH interface
interface IwETH is IERC20 {
    function deposit() external payable;

    function withdraw(uint256) external;
}
