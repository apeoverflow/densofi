// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import {InitialSupplySuperchainERC20} from "src/InitialSupplySuperchainERC20.sol";
import {DensoFiUniV3Vault} from "src/DensofiUniV3Vault.sol";
import {INonfungiblePositionManager} from "src/interfaces/INonfungiblePositionManager.sol";
import {IUniV3Router} from "src/interfaces/IUniV3Router.sol";
import {IPyth} from "src/interfaces/IPyth.sol";
import {PythStructs} from "src/interfaces/PythStructs.sol";
import {IwETH} from "src/interfaces/IwETH.sol";
import {IUniswapV3Factory} from "src/interfaces/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "src/interfaces/IUniswapV3Pool.sol";

contract DensoFiLaunchpad is Ownable, ReentrancyGuard {
    // Custom errors
    error InvalidParams();
    error SellPenaltyTooHigh();
    error InsufficientPayment();
    error TokenNotFound();
    error PoolLocked();
    error NotAuthorizedMinter();
    error InvalidAddress();
    error TokenAlreadyExists();
    error PoolNotReadyForLaunch();
    error InvalidPrice();
    error InsufficientETHForPurchase();
    error InsufficientTokensOut();
    error InsufficientETHOut();
    error InsufficientETHInPool();
    error InsufficientFeeForPriceUpdate();
    error FeeTooHigh();
    error InvalidTokenBalance();
    error DomainNotFound();
    error ArraysLengthMismatch();
    // Constants
    uint256 public constant TOKEN_SUPPLY = 1_000_000_000 ether;
    uint256 public constant FAKE_POOL_BASE_ETHER = 1.56 ether;
    uint24 public constant POOL_FEE = 3000; // 0.3%
    uint256 internal constant Q96 = 0x1000000000000000000000000;

    // Configuration
    uint32 public s_creationPrice = 1; // USD
    uint16 public s_txFee = 10; // 1%
    uint16 public s_launchFee = 30; // 3%
    uint32 public s_fakePoolMCapThreshold = 75_000; // USD
    uint32 public s_maxPriceStaleness = 172800; // 48 hours in seconds

    // Addresses
    address public s_uniV3Router;
    address public s_uniV3Factory;
    address public s_nonfungiblePositionManager;
    address public s_weth;
    IPyth public s_pythOracle;
    bytes32 public s_ethUsdPriceId;

    // State
    uint256 public s_proceeds;

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
    mapping(address => FakePool) public s_fakePools;
    mapping(address => address) public s_tokenCreators;
    mapping(string => address) public s_domainToVault; // domain name -> vault address
    mapping(address => string) public s_vaultToDomain; // vault address -> domain name
    mapping(address => bool) public s_authorizedMinters; // authorized token minter contracts

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
    event DomainAssignedToVault(
        string indexed domainName,
        address indexed vault
    );
    event VaultDomainOwnershipUpdated(
        address indexed vault,
        address indexed newOwner
    );
    event TokenAcceptedFromMinter(
        address indexed creator,
        address indexed token,
        address indexed minter,
        uint16 sellPenalty
    );
    event MinterAuthorized(address indexed minter, bool authorized);

    constructor(
        address _owner,
        address _uniV3Router,
        address _uniV3Factory,
        address _nonfungiblePositionManager,
        address _weth,
        address _pythOracle,
        bytes32 _ethUsdPriceId
    ) Ownable(_owner) {
        s_uniV3Router = _uniV3Router;
        s_uniV3Factory = _uniV3Factory;
        s_nonfungiblePositionManager = _nonfungiblePositionManager;
        s_weth = _weth;
        s_pythOracle = IPyth(_pythOracle);
        s_ethUsdPriceId = _ethUsdPriceId;
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
        if (bytes(name).length > 18 || bytes(symbol).length > 18 || bytes(description).length > 512) revert InvalidParams();
        if (sellPenalty > 100) revert SellPenaltyTooHigh();

        // Calculate creation fee and remaining ETH
        uint256 remainingEth = _handleCreationFee();

        // Create token and get address
        address tokenAddress = _createTokenContract(name, symbol);

        // Setup fake pool
        _setupFakePool(tokenAddress, sellPenalty);

        // Emit events
        _emitTokenCreationEvents(
            tokenAddress,
            name,
            symbol,
            imageCid,
            description,
            sellPenalty
        );

        // Handle initial buy if specified
        if (initialBuy > 0) {
            remainingEth = _handleInitialBuy(
                tokenAddress,
                initialBuy,
                remainingEth
            );
        }

        // Refund remaining ETH
        if (remainingEth > 0) {
            payable(msg.sender).transfer(remainingEth);
        }
    }

    function _handleCreationFee() internal returns (uint256) {
        uint256 creationEth = usdToEth(getOraclePrice(), s_creationPrice);
        if (msg.value < creationEth) revert InsufficientPayment();

        s_proceeds += creationEth;
        return msg.value - creationEth;
    }

    function _createTokenContract(
        string calldata name,
        string calldata symbol
    ) internal returns (address) {
        InitialSupplySuperchainERC20 token = new InitialSupplySuperchainERC20(
            address(this), // owner
            name, // name
            symbol, // symbol
            18, // decimals
            TOKEN_SUPPLY, // initialSupply
            block.chainid, // initialSupplyChainId
            false // shouldLaunch - false because it goes to launchpad
        );
        return address(token);
    }

    function _setupFakePool(address tokenAddress, uint16 sellPenalty) internal {
        FakePool storage pool = s_fakePools[tokenAddress];
        pool.token = tokenAddress;
        pool.creator = msg.sender;
        pool.fakeEth = FAKE_POOL_BASE_ETHER;
        pool.ethReserve = FAKE_POOL_BASE_ETHER;
        pool.tokenReserve = TOKEN_SUPPLY;
        pool.sellPenalty = sellPenalty;

        s_tokenCreators[tokenAddress] = msg.sender;
    }

    function _emitTokenCreationEvents(
        address tokenAddress,
        string calldata name,
        string calldata symbol,
        string calldata imageCid,
        string calldata description,
        uint16 sellPenalty
    ) internal {
        FakePool storage pool = s_fakePools[tokenAddress];
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
    }

    function _handleInitialBuy(
        address tokenAddress,
        uint256 initialBuy,
        uint256 remainingEth
    ) internal returns (uint256) {
        require(remainingEth >= initialBuy, "Insufficient ETH for initial buy");

        uint256 tokensOut = _buyTokens(tokenAddress, initialBuy);
        InitialSupplySuperchainERC20(tokenAddress).transfer(
            msg.sender,
            tokensOut
        );

        FakePool storage pool = s_fakePools[tokenAddress];
        emit Bought(
            msg.sender,
            tokenAddress,
            initialBuy,
            tokensOut,
            getTokenPrice(pool, 1 ether)
        );

        return remainingEth - initialBuy;
    }

    // Create token from authorized minter (TokenMinter contract)
    function createTokenFromMinter(
        address owner,
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupply
    ) external returns (InitialSupplySuperchainERC20) {
        if (!s_authorizedMinters[msg.sender]) revert NotAuthorizedMinter();
        if (owner == address(0)) revert InvalidAddress();
        if (bytes(tokenName).length == 0 || bytes(tokenSymbol).length == 0) revert InvalidParams();
        if (initialSupply == 0) revert InvalidParams();

        // Create token with launchpad as the launcher (this contract becomes msg.sender)
        InitialSupplySuperchainERC20 newToken = new InitialSupplySuperchainERC20(
            owner, // owner receives the tokens
            tokenName, // name
            tokenSymbol, // symbol
            18, // decimals
            initialSupply, // initial supply
            block.chainid, // initial supply chain ID (current chain)
            false // should not launch immediately - launchpad controls launch
        );

        return newToken;
    }

    // Accept token from authorized minter (TokenMinter contract)
    function acceptTokenFromMinter(
        address tokenAddress,
        address creator,
        uint16 sellPenalty
    ) external {
        if (!s_authorizedMinters[msg.sender]) revert NotAuthorizedMinter();
        if (tokenAddress == address(0) || creator == address(0)) revert InvalidAddress();
        if (sellPenalty > 100) revert SellPenaltyTooHigh();
        if (s_fakePools[tokenAddress].token != address(0)) revert TokenAlreadyExists();

        // Verify that this contract owns the tokens
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(tokenAddress);
        if (token.owner() != address(this)) revert InvalidAddress();
        uint256 tokenSupply = token.totalSupply();
        if (token.balanceOf(address(this)) != tokenSupply) revert InvalidTokenBalance();

        // Setup fake pool for the token
        FakePool storage pool = s_fakePools[tokenAddress];
        pool.token = tokenAddress;
        pool.creator = creator;
        pool.fakeEth = FAKE_POOL_BASE_ETHER;
        pool.ethReserve = FAKE_POOL_BASE_ETHER;
        pool.tokenReserve = tokenSupply;
        pool.sellPenalty = sellPenalty;
        pool.locked = false;

        s_tokenCreators[tokenAddress] = creator;

        emit TokenAcceptedFromMinter(creator, tokenAddress, msg.sender, sellPenalty);
        emit FakePoolCreated(
            tokenAddress,
            sellPenalty,
            pool.ethReserve,
            pool.tokenReserve
        );
    }

    // Buy tokens
    function buyTokens(
        address tokenAddress,
        uint256 minTokensOut
    ) external payable nonReentrant {
        if (msg.value == 0) revert InsufficientPayment();

        FakePool storage pool = s_fakePools[tokenAddress];
        if (pool.token == address(0)) revert TokenNotFound();
        if (pool.locked) revert PoolLocked();

        uint256 tokensOut = _buyTokens(tokenAddress, msg.value);
        if (tokensOut < minTokensOut) revert InsufficientTokensOut();

        InitialSupplySuperchainERC20(tokenAddress).transfer(
            msg.sender,
            tokensOut
        );

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
        uint256 updateFee = s_pythOracle.getUpdateFee(pythPriceUpdate);
        s_pythOracle.updatePriceFeeds{value: updateFee}(pythPriceUpdate);

        uint256 adjustedValue = msg.value - updateFee;
        if (adjustedValue == 0) revert InsufficientETHForPurchase();

        FakePool storage pool = s_fakePools[tokenAddress];
        if (pool.token == address(0)) revert TokenNotFound();
        if (pool.locked) revert PoolLocked();

        uint256 tokensOut = _buyTokens(tokenAddress, adjustedValue);
        if (tokensOut < minTokensOut) revert InsufficientTokensOut();

        InitialSupplySuperchainERC20(tokenAddress).transfer(
            msg.sender,
            tokensOut
        );

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
        FakePool storage pool = s_fakePools[tokenAddress];
        if (pool.token == address(0)) revert TokenNotFound();
        if (pool.locked) revert PoolLocked();

        InitialSupplySuperchainERC20(tokenAddress).transferFrom(
            msg.sender,
            address(this),
            tokenAmount
        );

        uint256 ethOut = _sellTokens(tokenAddress, tokenAmount);
        if (ethOut < minEthOut) revert InsufficientETHOut();

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
        FakePool storage pool = s_fakePools[tokenAddress];

        // Deduct transaction fee
        uint256 fee = (ethAmount * s_txFee) / 1000;
        s_proceeds += fee;
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
        FakePool storage pool = s_fakePools[tokenAddress];

        if (pool.ethReserve < pool.fakeEth) revert InsufficientETHInPool();

        // Calculate ETH out using AMM formula
        uint256 ethOut = getAmountOut(
            tokenAmount,
            pool.tokenReserve,
            pool.ethReserve
        );

        // Deduct transaction fee
        uint256 fee = (ethOut * s_txFee) / 1000;
        s_proceeds += fee;
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

        // Check market cap threshold
        _checkMarketCapThreshold(pool);

        return ethOut;
    }

    // Launch token to Uniswap V3
    function launchToken(
        address tokenAddress
    ) external payable onlyOwner nonReentrant {
        FakePool storage pool = s_fakePools[tokenAddress];
        if (pool.token == address(0)) revert TokenNotFound();
        if (!pool.locked) revert PoolNotReadyForLaunch();

        uint256 ethForLaunch = pool.ethReserve - pool.fakeEth;
        uint256 tokensForLaunch = pool.tokenReserve;

        // Deduct launch fee
        uint256 launchFeeAmount = (ethForLaunch * s_launchFee) / 1000;
        s_proceeds += launchFeeAmount;
        ethForLaunch -= launchFeeAmount;

        // Add any additional ETH sent with transaction
        ethForLaunch += msg.value;

        // Launch token
        InitialSupplySuperchainERC20(tokenAddress).launch();

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
            pool.creator,
            InitialSupplySuperchainERC20(tokenAddress).name()
        );

        emit TokenLaunched(pool.creator, tokenAddress, poolAddress, vault);
    }


    // Create Uniswap V3 pool
    function _createUniV3Pool(
        address token,
        uint256 tokenAmount,
        uint256 ethAmount
    ) internal returns (address) {
        (address token0, address token1) = token < s_weth
            ? (token, s_weth)
            : (s_weth, token);
        (uint256 amount0, uint256 amount1) = token < s_weth
            ? (tokenAmount, ethAmount)
            : (ethAmount, tokenAmount);

        // Calculate initial price
        uint160 sqrtPrice = uint160(
            Math.mulDiv(Math.sqrt(amount1), Q96, Math.sqrt(amount0))
        );

        // Get or create pool
        address poolAddress = IUniswapV3Factory(s_uniV3Factory).getPool(
            token0,
            token1,
            POOL_FEE
        );
        if (poolAddress == address(0)) {
            poolAddress = IUniswapV3Factory(s_uniV3Factory).createPool(
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
        address creator,
        string memory domainName
    ) internal returns (address) {
        // Create vault for the creator with domain name
        DensoFiUniV3Vault vault = new DensoFiUniV3Vault(
            address(this),
            creator,
            s_nonfungiblePositionManager,
            domainName
        );

        // Store domain mappings
        s_domainToVault[domainName] = address(vault);
        s_vaultToDomain[address(vault)] = domainName;

        // Wrap ETH
        IwETH(s_weth).deposit{value: ethAmount}();

        // Approve tokens
        InitialSupplySuperchainERC20(token).approve(
            s_nonfungiblePositionManager,
            tokenAmount
        );
        IERC20(s_weth).approve(s_nonfungiblePositionManager, ethAmount);

        (address token0, address token1) = token < s_weth
            ? (token, s_weth)
            : (s_weth, token);
        (uint256 amount0, uint256 amount1) = token < s_weth
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

        (uint256 tokenId, , , ) = INonfungiblePositionManager(
            s_nonfungiblePositionManager
        ).mint(params);

        // Ensure vault has the token ID (fallback in case onERC721Received doesn't work)
        vault.setTokenId(tokenId);

        emit DomainAssignedToVault(domainName, address(vault));

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
        FakePool memory pool = s_fakePools[tokenAddress];
        if (pool.token == address(0)) revert TokenNotFound();

        if (buyOrder) {
            // Calculate tokens out for ETH in
            uint256 ethAfterFee = amount - (amount * s_txFee) / 1000;
            return
                getAmountOut(ethAfterFee, pool.ethReserve, pool.tokenReserve);
        } else {
            // Calculate ETH out for tokens in
            uint256 ethOut = getAmountOut(
                amount,
                pool.tokenReserve,
                pool.ethReserve
            );
            ethOut -= (ethOut * s_txFee) / 1000;
            if (pool.sellPenalty > 0) {
                ethOut -= (ethOut * pool.sellPenalty) / 1000;
            }
            return ethOut;
        }
    }

    function _checkMarketCapThreshold(FakePool storage pool) internal {
        uint256 tokenPrice = getTokenPrice(pool, 1 ether);
        // Use circulating supply instead of total supply for market cap calculation
        uint256 circulatingSupply = TOKEN_SUPPLY - pool.tokenReserve;
        uint256 ethMcap = (circulatingSupply * tokenPrice) / 1 ether;

        uint256 usdEthPrice = getOraclePrice();
        uint256 amountUsd = ethToUsd(usdEthPrice, ethMcap);


        if (amountUsd >= s_fakePoolMCapThreshold) {
            pool.locked = true;
            emit FakePoolMCapReached(pool.token);
        }
    }

    // Oracle functions - now more flexible
    function getOraclePrice() public view returns (uint256) {
        PythStructs.Price memory price = s_pythOracle.getPriceNoOlderThan(
            s_ethUsdPriceId,
            s_maxPriceStaleness
        );

        if (price.price <= 0) revert InvalidPrice();
        if (price.expo < -18 || price.expo > 18) revert InvalidPrice();

        uint256 base = uint64(price.price);
        uint256 ethPrice8Decimals;

        if (price.expo >= 0) {
            uint256 factor = 10 ** (uint32(price.expo));
            ethPrice8Decimals = Math.mulDiv(base, factor * 1e8, 1);
        } else {
            uint256 factor = 10 ** uint32(-price.expo);
            ethPrice8Decimals = Math.mulDiv(base, 1e8, factor);
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
        s_creationPrice = _price;
    }

    function setTxFee(uint16 _fee) external onlyOwner {
        if (_fee > 100) revert FeeTooHigh();
        s_txFee = _fee;
    }

    function setLaunchFee(uint16 _fee) external onlyOwner {
        if (_fee > 200) revert FeeTooHigh();
        s_launchFee = _fee;
    }

    function setFakePoolMCapThreshold(uint32 _threshold) external onlyOwner {
        s_fakePoolMCapThreshold = _threshold;
    }

    function setPythOracle(address _pythOracle) external onlyOwner {
        s_pythOracle = IPyth(_pythOracle);
    }

    function setEthUsdPriceId(bytes32 _ethUsdPriceId) external onlyOwner {
        s_ethUsdPriceId = _ethUsdPriceId;
    }

    function withdrawProceeds() external onlyOwner {
        uint256 amount = s_proceeds;
        s_proceeds = 0;
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
        FakePool memory pool = s_fakePools[tokenAddress];
        return (
            pool.ethReserve,
            pool.tokenReserve,
            pool.fakeEth,
            pool.creator,
            pool.sellPenalty,
            pool.locked
        );
    }

    function calculateMarketCap(
        address tokenAddress
    ) external view returns (uint256 ethMcap, uint256 usdMcap) {
        FakePool memory pool = s_fakePools[tokenAddress];
        if (pool.token == address(0)) revert TokenNotFound();

        uint256 tokenPrice = getTokenPrice(pool, 1 ether);
        uint256 circulatingSupply = TOKEN_SUPPLY - pool.tokenReserve;
        ethMcap = (circulatingSupply * tokenPrice) / 1 ether;

        uint256 usdEthPrice = getOraclePrice();
        usdMcap = ethToUsd(usdEthPrice, ethMcap);

        return (ethMcap, usdMcap);
    }


    // Admin function to set max price staleness
    function setMaxPriceStaleness(uint32 _maxStaleness) external onlyOwner {
        s_maxPriceStaleness = _maxStaleness;
    }

    // Admin function to authorize/deauthorize minter contracts
    function setMinterAuthorization(address minter, bool authorized) external onlyOwner {
        if (minter == address(0)) revert InvalidAddress();
        s_authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }

    // Admin function to update domain ownership
    function updateDomainOwnership(
        string memory domainName,
        address newOwner
    ) external onlyOwner {
        address vaultAddress = s_domainToVault[domainName];
        if (vaultAddress == address(0)) revert DomainNotFound();

        DensoFiUniV3Vault(vaultAddress).updateDomainOwner(newOwner);
        emit VaultDomainOwnershipUpdated(vaultAddress, newOwner);
    }


    // View function to get vault by domain
    function getVaultByDomain(
        string memory domainName
    ) external view returns (address) {
        return s_domainToVault[domainName];
    }

    // View function to get domain by vault
    function getDomainByVault(
        address vault
    ) external view returns (string memory) {
        return s_vaultToDomain[vault];
    }

    receive() external payable {
        // Allow contract to receive ETH
    }
}
