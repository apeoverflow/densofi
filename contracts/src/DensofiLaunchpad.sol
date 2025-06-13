// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import {Token} from "src/Token.sol";
import {DensoFiUniV3Vault} from "src/DensoFiUniV3Vault.sol";
import {INonfungiblePositionManager} from "src/interfaces/INonfungiblePositionManager.sol";
import {IUniV3Router} from "src/interfaces/IUniV3Router.sol";
import {IPyth} from "src/interfaces/IPyth.sol";
import {PythStructs} from "src/interfaces/PythStructs.sol";
import {IwETH} from "src/interfaces/IwETH.sol";
import {IUniswapV3Factory} from "src/interfaces/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "src/interfaces/IUniswapV3Pool.sol";

contract DensoFiLaunchpad is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant TOKEN_SUPPLY = 1_000_000_000 ether;
    uint256 public constant FAKE_POOL_BASE_ETHER = 1.56 ether;
    uint24 public constant POOL_FEE = 3000; // 0.3%
    uint256 internal constant Q96 = 0x1000000000000000000000000;

    // Configuration
    uint32 public creationPrice = 1; // USD
    uint16 public txFee = 10; // 1%
    uint16 public launchFee = 30; // 3%
    uint32 public fakePoolMCapThreshold = 75_000; // USD

    // Addresses
    address public uniV3Router;
    address public uniV3Factory;
    address public nonfungiblePositionManager;
    address public weth;
    IPyth public pythOracle;
    bytes32 public ethUsdPriceId;

    // State
    uint256 public proceeds;

    // Structs
    struct FakePool {
        uint256 fakeEth;
        uint256 ethReserve;
        uint256 tokenReserve;
        address token;
        address creator;
        uint16 sellPenalty;
        bool locked;
    }

    // Mappings
    mapping(address => FakePool) public fakePools;
    mapping(address => address) public tokenCreators;

    // Events
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
    event Bought(
        address indexed buyer,
        address indexed token,
        uint256 ethIn,
        uint256 tokensOut,
        uint256 newPrice
    );
    event Sold(
        address indexed seller,
        address indexed token,
        uint256 ethOut,
        uint256 tokensIn,
        uint256 newPrice
    );
    event FakePoolCreated(
        address indexed token,
        uint16 sellPenalty,
        uint256 ethReserve,
        uint256 tokenReserve
    );
    event FakePoolMCapReached(address indexed token);

    constructor(
        address _uniV3Router,
        address _uniV3Factory,
        address _nonfungiblePositionManager,
        address _weth,
        address _pythOracle,
        bytes32 _ethUsdPriceId
    ) Ownable(msg.sender) {
        uniV3Router = _uniV3Router;
        uniV3Factory = _uniV3Factory;
        nonfungiblePositionManager = _nonfungiblePositionManager;
        weth = _weth;
        pythOracle = IPyth(_pythOracle);
        ethUsdPriceId = _ethUsdPriceId;
    }

    // Token Creation
    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata imageCid,
        string calldata description,
        uint16 sellPenalty,
        uint256 initialBuy
    ) external payable nonReentrant {
        require(
            bytes(name).length <= 18 &&
                bytes(symbol).length <= 18 &&
                bytes(description).length <= 512,
            "Invalid params"
        );
        require(sellPenalty <= 100, "Sell penalty too high"); // Max 10%

        // Calculate creation fee
        uint256 usdEthPrice = getOraclePrice();
        uint256 creationEth = usdToEth(usdEthPrice, creationPrice);
        require(msg.value >= creationEth, "Insufficient payment");

        uint256 remainingEth = msg.value - creationEth;
        proceeds += creationEth;

        // Create token
        Token token = new Token(name, symbol, TOKEN_SUPPLY, address(this));
        address tokenAddress = address(token);

        // Create fake pool
        FakePool storage pool = fakePools[tokenAddress];
        pool.token = tokenAddress;
        pool.creator = msg.sender;
        pool.fakeEth = FAKE_POOL_BASE_ETHER;
        pool.ethReserve = FAKE_POOL_BASE_ETHER;
        pool.tokenReserve = TOKEN_SUPPLY;
        pool.sellPenalty = sellPenalty;

        tokenCreators[tokenAddress] = msg.sender;

        uint256 initialPrice = getTokenPrice(pool, 1 ether);

        emit TokenCreated(
            msg.sender,
            tokenAddress,
            TOKEN_SUPPLY,
            name,
            symbol,
            imageCid,
            description,
            initialPrice
        );

        emit FakePoolCreated(
            tokenAddress,
            sellPenalty,
            pool.ethReserve,
            pool.tokenReserve
        );

        // Handle initial buy
        if (initialBuy > 0) {
            require(
                remainingEth >= initialBuy,
                "Insufficient ETH for initial buy"
            );
            remainingEth -= initialBuy;

            uint256 tokensOut = _buyTokens(tokenAddress, initialBuy);
            token.transfer(msg.sender, tokensOut);

            emit Bought(
                msg.sender,
                tokenAddress,
                initialBuy,
                tokensOut,
                getTokenPrice(pool, 1 ether)
            );
        }

        // Refund remaining ETH
        if (remainingEth > 0) {
            payable(msg.sender).transfer(remainingEth);
        }
    }

    // Token Creation with Price Update
    function createTokenWithUpdate(
        string calldata name,
        string calldata symbol,
        string calldata imageCid,
        string calldata description,
        uint16 sellPenalty,
        uint256 initialBuy,
        bytes[] calldata pythPriceUpdate
    ) external payable nonReentrant {
        // Update Pyth price feeds first
        uint256 updateFee = pythOracle.getUpdateFee(pythPriceUpdate);
        pythOracle.updatePriceFeeds{value: updateFee}(pythPriceUpdate);

        // Reduce msg.value by update fee for token creation
        uint256 adjustedValue = msg.value - updateFee;

        // Use internal function to avoid double payment handling
        _createTokenInternal(
            name,
            symbol,
            imageCid,
            description,
            sellPenalty,
            initialBuy,
            adjustedValue
        );
    }

    // Internal token creation function
    function _createTokenInternal(
        string calldata name,
        string calldata symbol,
        string calldata imageCid,
        string calldata description,
        uint16 sellPenalty,
        uint256 initialBuy,
        uint256 availableValue
    ) internal {
        require(
            bytes(name).length <= 18 &&
                bytes(symbol).length <= 18 &&
                bytes(description).length <= 512,
            "Invalid params"
        );
        require(sellPenalty <= 100, "Sell penalty too high");

        // Calculate creation fee
        uint256 usdEthPrice = getOraclePrice();
        uint256 creationEth = usdToEth(usdEthPrice, creationPrice);
        require(availableValue >= creationEth, "Insufficient payment");

        uint256 remainingEth = availableValue - creationEth;
        proceeds += creationEth;

        // Create token
        Token token = new Token(name, symbol, TOKEN_SUPPLY, address(this));
        address tokenAddress = address(token);

        // Create fake pool
        FakePool storage pool = fakePools[tokenAddress];
        pool.token = tokenAddress;
        pool.creator = msg.sender;
        pool.fakeEth = FAKE_POOL_BASE_ETHER;
        pool.ethReserve = FAKE_POOL_BASE_ETHER;
        pool.tokenReserve = TOKEN_SUPPLY;
        pool.sellPenalty = sellPenalty;

        tokenCreators[tokenAddress] = msg.sender;

        uint256 initialPrice = getTokenPrice(pool, 1 ether);

        emit TokenCreated(
            msg.sender,
            tokenAddress,
            TOKEN_SUPPLY,
            name,
            symbol,
            imageCid,
            description,
            initialPrice
        );

        emit FakePoolCreated(
            tokenAddress,
            sellPenalty,
            pool.ethReserve,
            pool.tokenReserve
        );

        // Handle initial buy
        if (initialBuy > 0) {
            require(
                remainingEth >= initialBuy,
                "Insufficient ETH for initial buy"
            );
            remainingEth -= initialBuy;

            uint256 tokensOut = _buyTokens(tokenAddress, initialBuy);
            token.transfer(msg.sender, tokensOut);

            emit Bought(
                msg.sender,
                tokenAddress,
                initialBuy,
                tokensOut,
                getTokenPrice(pool, 1 ether)
            );
        }

        // Refund remaining ETH
        if (remainingEth > 0) {
            payable(msg.sender).transfer(remainingEth);
        }
    }

    // Buy tokens
    function buyTokens(
        address tokenAddress,
        uint256 minTokensOut
    ) external payable nonReentrant {
        require(msg.value > 0, "No ETH sent");

        FakePool storage pool = fakePools[tokenAddress];
        require(pool.token != address(0), "Token not found");
        require(!pool.locked, "Pool is locked");

        uint256 tokensOut = _buyTokens(tokenAddress, msg.value);
        require(tokensOut >= minTokensOut, "Insufficient tokens out");

        Token(tokenAddress).transfer(msg.sender, tokensOut);

        emit Bought(
            msg.sender,
            tokenAddress,
            msg.value,
            tokensOut,
            getTokenPrice(pool, 1 ether)
        );
    }

    // Buy tokens with price update
    function buyTokensWithUpdate(
        address tokenAddress,
        uint256 minTokensOut,
        bytes[] calldata pythPriceUpdate
    ) external payable nonReentrant {
        // Update Pyth price feeds first
        uint256 updateFee = pythOracle.getUpdateFee(pythPriceUpdate);
        pythOracle.updatePriceFeeds{value: updateFee}(pythPriceUpdate);

        uint256 adjustedValue = msg.value - updateFee;
        require(adjustedValue > 0, "No ETH for purchase after update fee");

        FakePool storage pool = fakePools[tokenAddress];
        require(pool.token != address(0), "Token not found");
        require(!pool.locked, "Pool is locked");

        uint256 tokensOut = _buyTokens(tokenAddress, adjustedValue);
        require(tokensOut >= minTokensOut, "Insufficient tokens out");

        Token(tokenAddress).transfer(msg.sender, tokensOut);

        emit Bought(
            msg.sender,
            tokenAddress,
            adjustedValue,
            tokensOut,
            getTokenPrice(pool, 1 ether)
        );
    }

    // Sell tokens
    function sellTokens(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 minEthOut
    ) external nonReentrant {
        FakePool storage pool = fakePools[tokenAddress];
        require(pool.token != address(0), "Token not found");
        require(!pool.locked, "Pool is locked");

        Token(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            tokenAmount
        );

        uint256 ethOut = _sellTokens(tokenAddress, tokenAmount);
        require(ethOut >= minEthOut, "Insufficient ETH out");

        payable(msg.sender).transfer(ethOut);

        emit Sold(
            msg.sender,
            tokenAddress,
            ethOut,
            tokenAmount,
            getTokenPrice(pool, 1 ether)
        );
    }

    // Internal buy logic
    function _buyTokens(
        address tokenAddress,
        uint256 ethAmount
    ) internal returns (uint256) {
        FakePool storage pool = fakePools[tokenAddress];

        // Deduct transaction fee
        uint256 fee = (ethAmount * txFee) / 1000;
        proceeds += fee;
        uint256 ethAfterFee = ethAmount - fee;

        // Calculate tokens out using AMM formula
        uint256 tokensOut = getAmountOut(
            ethAfterFee,
            pool.ethReserve,
            pool.tokenReserve
        );

        // Update reserves
        pool.ethReserve += ethAfterFee;
        pool.tokenReserve -= tokensOut;

        // Check market cap threshold
        _checkMarketCapThreshold(pool);

        return tokensOut;
    }

    // Internal sell logic
    function _sellTokens(
        address tokenAddress,
        uint256 tokenAmount
    ) internal returns (uint256) {
        FakePool storage pool = fakePools[tokenAddress];

        // Calculate ETH out using AMM formula
        uint256 ethOut = getAmountOut(
            tokenAmount,
            pool.tokenReserve,
            pool.ethReserve
        );

        // Deduct transaction fee
        uint256 fee = (ethOut * txFee) / 1000;
        proceeds += fee;
        ethOut -= fee;

        // Apply sell penalty and update reserves correctly
        uint256 penalty = 0;
        if (pool.sellPenalty > 0) {
            penalty = (ethOut * pool.sellPenalty) / 1000;
            ethOut -= penalty;
            // Penalty stays in the pool (increases value for remaining holders)
        }

        // Update reserves: subtract what user receives, add tokens back
        // The penalty amount remains in the pool automatically
        pool.ethReserve -= ethOut;
        pool.tokenReserve += tokenAmount;

        require(pool.ethReserve >= pool.fakeEth, "Insufficient ETH in pool");

        // Check market cap threshold
        _checkMarketCapThreshold(pool);

        return ethOut;
    }

    // Launch token to Uniswap V3
    function launchToken(
        address tokenAddress
    ) external payable onlyOwner nonReentrant {
        FakePool storage pool = fakePools[tokenAddress];
        require(pool.token != address(0), "Token not found");
        require(pool.locked, "Pool not ready for launch");

        uint256 ethForLaunch = pool.ethReserve - pool.fakeEth;
        uint256 tokensForLaunch = pool.tokenReserve;

        // Deduct launch fee
        uint256 launchFeeAmount = (ethForLaunch * launchFee) / 1000;
        proceeds += launchFeeAmount;
        ethForLaunch -= launchFeeAmount;

        // Add any additional ETH sent with transaction
        ethForLaunch += msg.value;

        // Launch token
        Token(tokenAddress).launch();

        // Create Uniswap V3 pool and add liquidity
        address poolAddress = _createUniV3Pool(
            tokenAddress,
            tokensForLaunch,
            ethForLaunch
        );
        address vault = _addLiquidityToV3Pool(
            tokenAddress,
            tokensForLaunch,
            ethForLaunch,
            pool.creator
        );

        emit TokenLaunched(pool.creator, tokenAddress, poolAddress, vault);
    }

    // Create Uniswap V3 pool
    function _createUniV3Pool(
        address token,
        uint256 tokenAmount,
        uint256 ethAmount
    ) internal returns (address) {
        (address token0, address token1) = token < weth
            ? (token, weth)
            : (weth, token);
        (uint256 amount0, uint256 amount1) = token < weth
            ? (tokenAmount, ethAmount)
            : (ethAmount, tokenAmount);

        // Calculate initial price
        uint160 sqrtPrice = uint160(
            Math.mulDiv(Math.sqrt(amount1), Q96, Math.sqrt(amount0))
        );

        // Get or create pool
        address poolAddress = IUniswapV3Factory(uniV3Factory).getPool(
            token0,
            token1,
            POOL_FEE
        );
        if (poolAddress == address(0)) {
            poolAddress = IUniswapV3Factory(uniV3Factory).createPool(
                token0,
                token1,
                POOL_FEE
            );
            IUniswapV3Pool(poolAddress).initialize(sqrtPrice);
        }

        return poolAddress;
    }

    // Add liquidity to Uniswap V3 pool
    function _addLiquidityToV3Pool(
        address token,
        uint256 tokenAmount,
        uint256 ethAmount,
        address creator
    ) internal returns (address) {
        // Create vault for the creator
        DensoFiUniV3Vault vault = new DensoFiUniV3Vault(
            address(this),
            creator,
            nonfungiblePositionManager
        );

        // Wrap ETH
        IwETH(weth).deposit{value: ethAmount}();

        // Approve tokens
        Token(token).approve(nonfungiblePositionManager, tokenAmount);
        IERC20(weth).approve(nonfungiblePositionManager, ethAmount);

        (address token0, address token1) = token < weth
            ? (token, weth)
            : (weth, token);
        (uint256 amount0, uint256 amount1) = token < weth
            ? (tokenAmount, ethAmount)
            : (ethAmount, tokenAmount);

        // Create position
        INonfungiblePositionManager.MintParams memory params = INonfungiblePositionManager
            .MintParams({
                token0: token0,
                token1: token1,
                fee: POOL_FEE,
                tickLower: -887220, // Full range
                tickUpper: 887220,
                amount0Desired: amount0,
                amount1Desired: amount1,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(vault),
                deadline: block.timestamp + 15 minutes
            });

        INonfungiblePositionManager(nonfungiblePositionManager).mint(params);

        return address(vault);
    }

    // Utility functions
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) public pure returns (uint256) {
        uint256 numerator = amountIn * reserveOut;
        uint256 denominator = reserveIn + amountIn;
        return numerator / denominator;
    }

    function getTokenPrice(
        FakePool memory pool,
        uint256 amount
    ) public pure returns (uint256) {
        return (amount * pool.ethReserve) / pool.tokenReserve;
    }

    function quoteTokens(
        address tokenAddress,
        uint256 amount,
        bool buyOrder
    ) external view returns (uint256) {
        FakePool memory pool = fakePools[tokenAddress];
        require(pool.token != address(0), "Token not found");

        if (buyOrder) {
            // Calculate tokens out for ETH in
            uint256 ethAfterFee = amount - (amount * txFee) / 1000;
            return
                getAmountOut(ethAfterFee, pool.ethReserve, pool.tokenReserve);
        } else {
            // Calculate ETH out for tokens in
            uint256 ethOut = getAmountOut(
                amount,
                pool.tokenReserve,
                pool.ethReserve
            );
            ethOut -= (ethOut * txFee) / 1000;
            if (pool.sellPenalty > 0) {
                ethOut -= (ethOut * pool.sellPenalty) / 1000;
            }
            return ethOut;
        }
    }

    function _checkMarketCapThreshold(FakePool storage pool) internal {
        uint256 tokenPrice = getTokenPrice(pool, 1 ether);
        uint256 ethMcap = (TOKEN_SUPPLY * tokenPrice) / 1 ether;

        uint256 usdEthPrice = getOraclePrice();
        uint256 amountUsd = ethToUsd(usdEthPrice, ethMcap);

        if (amountUsd >= fakePoolMCapThreshold) {
            pool.locked = true;
            emit FakePoolMCapReached(pool.token);
        }
    }

    // Oracle functions
    function getOraclePrice() public view returns (uint256) {
        PythStructs.Price memory price = pythOracle.getPriceNoOlderThan(
            ethUsdPriceId,
            3600 // 1 hour staleness tolerance
        );
        require(price.price > 0, "Invalid price");

        // Convert Pyth price to 8 decimal format (like Chainlink)
        // Pyth price has variable exponent, convert to 8 decimals
        uint256 ethPrice8Decimals;
        if (price.expo >= 0) {
            ethPrice8Decimals =
                uint256(uint64(price.price)) *
                (10 ** uint32(price.expo)) *
                (10 ** 8);
        } else {
            ethPrice8Decimals =
                (uint256(uint64(price.price)) * (10 ** 8)) /
                (10 ** uint32(-1 * price.expo));
        }

        return ethPrice8Decimals;
    }

    function ethToUsd(
        uint256 ethUsdPrice,
        uint256 ethAmount
    ) public pure returns (uint256) {
        return (ethAmount * ethUsdPrice) / (10 ** (8 + 18));
    }

    function usdToEth(
        uint256 ethUsdPrice,
        uint256 usdAmount
    ) public pure returns (uint256) {
        return (usdAmount * 10 ** (8 + 18)) / ethUsdPrice;
    }

    // Admin functions
    function setCreationPrice(uint32 _price) external onlyOwner {
        creationPrice = _price;
    }

    function setTxFee(uint16 _fee) external onlyOwner {
        require(_fee <= 100, "Fee too high"); // Max 10%
        txFee = _fee;
    }

    function setLaunchFee(uint16 _fee) external onlyOwner {
        require(_fee <= 200, "Fee too high"); // Max 20%
        launchFee = _fee;
    }

    function setFakePoolMCapThreshold(uint32 _threshold) external onlyOwner {
        fakePoolMCapThreshold = _threshold;
    }

    function setPythOracle(address _pythOracle) external onlyOwner {
        pythOracle = IPyth(_pythOracle);
    }

    function setEthUsdPriceId(bytes32 _ethUsdPriceId) external onlyOwner {
        ethUsdPriceId = _ethUsdPriceId;
    }

    function withdrawProceeds() external onlyOwner {
        uint256 amount = proceeds;
        proceeds = 0;
        payable(owner()).transfer(amount);
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    // View functions
    function getPoolInfo(
        address tokenAddress
    )
        external
        view
        returns (
            uint256 ethReserve,
            uint256 tokenReserve,
            uint256 fakeEth,
            address creator,
            uint16 sellPenalty,
            bool locked
        )
    {
        FakePool memory pool = fakePools[tokenAddress];
        return (
            pool.ethReserve,
            pool.tokenReserve,
            pool.fakeEth,
            pool.creator,
            pool.sellPenalty,
            pool.locked
        );
    }

    receive() external payable {
        // Allow contract to receive ETH
    }
}
