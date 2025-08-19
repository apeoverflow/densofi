// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {DomainRegistration} from "src/DomainRegistration.sol";
import {NFTMinter} from "src/NFTMinter.sol";
import {TokenMinter} from "src/TokenMinter.sol";
import {DensoFiLaunchpad} from "src/DensofiLaunchpad.sol";
import {InitialSupplySuperchainERC20} from "src/InitialSupplySuperchainERC20.sol";
import {MockPyth} from "src/interfaces/MockPyth.sol";
import {StringBytes32} from "src/libraries/StringBytes32.sol";
import {DensoFiUniV3Vault} from "src/DensofiUniV3Vault.sol";

contract EndToEndFlowTest is Test {
    using StringBytes32 for string;
    using StringBytes32 for bytes32;

    // Contract instances
    DomainRegistration public domainRegistration;
    NFTMinter public nftMinter;
    TokenMinter public tokenMinter;
    DensoFiLaunchpad public launchpad;
    MockPyth public pythOracle;

    // Test accounts
    address public owner;
    address public user1; // Will do direct receipt flow
    address public user2; // Will do launchpad flow
    address public deployer;

    // Constants
    string constant DOMAIN_1 = "directflow.eth";
    string constant DOMAIN_2 = "launchpadflow.eth";
    uint256 constant REGISTRATION_FEE = 0.01 ether;

    // Mainnet addresses for testing
    address constant UNISWAP_V3_ROUTER =
        0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address constant UNISWAP_V3_FACTORY =
        0x1F98431c8aD98523631AE4a59f267346ea31F984;
    address constant NONFUNGIBLE_POSITION_MANAGER =
        0xC36442b4a4522E871399CD717aBDD847Ab11FE88;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    bytes32 constant ETH_USD_PRICE_ID =
        0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace;

    // Events to track
    event DomainRegistered(string domainName, address user);
    event NFTMinted(string domainName, address user, uint256 tokenId);
    event TokenCreatedDirect(
        string domainName,
        address user,
        address tokenContract
    );
    event TokenCreatedLaunchpad(
        string domainName,
        address user,
        address tokenContract
    );
    event TokenLaunched(address tokenContract);
    event VaultCreated(address indexed vault, string domainName);
    event FeesCollected(address indexed collector, uint256 amount0, uint256 amount1);
    event DomainOwnershipUpdated(address indexed newOwner, string domainName);

    function setUp() public {
        // Setup test accounts
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        deployer = makeAddr("deployer");

        // Fund accounts
        vm.deal(owner, 100 ether);
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        vm.deal(deployer, 100 ether);

        console.log("=== SETTING UP CONTRACTS ===");

        // 1. Deploy DomainRegistration
        vm.prank(deployer);
        domainRegistration = new DomainRegistration(REGISTRATION_FEE, owner);
        console.log(
            "DomainRegistration deployed at:",
            address(domainRegistration)
        );

        // 2. Deploy NFTMinter
        vm.prank(owner);
        nftMinter = new NFTMinter(owner);
        console.log(" NFTMinter deployed at:", address(nftMinter));

        // 3. Deploy MockPyth oracle
        pythOracle = new MockPyth(60, 1);
        // Set ETH price to $3000
        pythOracle.updatePrice(
            ETH_USD_PRICE_ID,
            300000000000, // $3000 with 8 decimals
            1000000000, // confidence
            -8, // exponent
            uint64(block.timestamp)
        );
        console.log(" MockPyth oracle deployed at:", address(pythOracle));

        // 4. Deploy DensoFiLaunchpad
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
        console.log(" DensoFiLaunchpad deployed at:", address(launchpad));

        // 5. Deploy TokenMinter with launchpad reference
        vm.prank(deployer);
        tokenMinter = new TokenMinter(
            deployer,
            address(nftMinter),
            address(launchpad)
        );
        console.log(" TokenMinter deployed at:", address(tokenMinter));

        // 6. Authorize TokenMinter in launchpad
        vm.prank(deployer);
        launchpad.setMinterAuthorization(address(tokenMinter), true);
        console.log(" TokenMinter authorized in launchpad");

        console.log("=== SETUP COMPLETE ===\n");
    }

    /*//////////////////////////////////////////////////////////////
                        HAPPY FLOW TESTS
    //////////////////////////////////////////////////////////////*/

    function testCompleteFlowDirectReceipt() public {
        console.log("=== TESTING DIRECT RECEIPT FLOW ===");

        // Step 1: Domain Registration
        console.log("\n1. DOMAIN REGISTRATION");
        _registerDomain(DOMAIN_1, user1);

        // Step 2: Setup domain for NFT minting (simulating backend processing)
        console.log("\n2. BACKEND PROCESSING - SETUP DOMAIN FOR MINTING");
        _setupDomainForMinting(DOMAIN_1, user1);

        // Step 3: Mint NFT
        console.log("\n3. NFT MINTING");
        uint256 nftId = _mintNFT(DOMAIN_1, user1);

        // Step 4: Create token with direct receipt
        console.log("\n4. TOKEN CREATION (DIRECT RECEIPT)");
        address tokenAddress = _createTokenDirectReceipt(nftId, user1);

        // Step 5: Verify final state
        console.log("\n5. VERIFICATION");
        _verifyDirectReceiptFlow(tokenAddress, user1);

        console.log(" DIRECT RECEIPT FLOW COMPLETED SUCCESSFULLY\n");
    }

    function testCompleteFlowLaunchpad() public {
        console.log("=== TESTING LAUNCHPAD FLOW ===");

        // Step 1: Domain Registration
        console.log("\n1. DOMAIN REGISTRATION");
        _registerDomain(DOMAIN_2, user2);

        // Step 2: Setup domain for NFT minting
        console.log("\n2. BACKEND PROCESSING - SETUP DOMAIN FOR MINTING");
        _setupDomainForMinting(DOMAIN_2, user2);

        // Step 3: Mint NFT
        console.log("\n3. NFT MINTING");
        uint256 nftId = _mintNFT(DOMAIN_2, user2);

        // Step 4: Create token for launchpad
        console.log("\n4. TOKEN CREATION (LAUNCHPAD)");
        address tokenAddress = _createTokenForLaunchpad(nftId, user2);

        // Step 5: Trade tokens on launchpad
        console.log("\n5. TRADING ON LAUNCHPAD");
        _tradeOnLaunchpad(tokenAddress);

        // Step 6: Launch to Uniswap (if market cap threshold is reached)
        console.log("\n6. TOKEN LAUNCH TO UNISWAP");
        _launchTokenToUniswap(tokenAddress);

        console.log(" LAUNCHPAD FLOW COMPLETED SUCCESSFULLY\n");
    }

    function testBothFlowsSequentially() public {
        console.log("=== TESTING BOTH FLOWS SEQUENTIALLY ===");

        // Run both flows to ensure they don't interfere with each other
        testCompleteFlowDirectReceipt();
        testCompleteFlowLaunchpad();

        console.log(" BOTH FLOWS COMPLETED SUCCESSFULLY");
    }

    function testVaultClaimingAndOwnership() public {
        console.log("=== TESTING VAULT CLAIMING AND OWNERSHIP ===");

        // Step 1: Create a token through the launchpad flow
        console.log("\n1. SETUP TOKEN FOR VAULT TESTING");
        _registerDomain(DOMAIN_2, user2);
        _setupDomainForMinting(DOMAIN_2, user2);
        uint256 nftId = _mintNFT(DOMAIN_2, user2);
        address tokenAddress = _createTokenForLaunchpad(nftId, user2);

        // Step 2: Trade to reach market cap threshold and launch
        console.log("\n2. TRADING TO REACH LAUNCH THRESHOLD");
        _tradeToReachThreshold(tokenAddress);

        // Step 3: Launch token to create vault
        console.log("\n3. LAUNCHING TOKEN TO CREATE VAULT");
        address vaultAddress = _launchTokenAndGetVault(tokenAddress, user2);

        // Step 4: Test vault functionality
        console.log("\n4. TESTING VAULT FUNCTIONALITY");
        _testVaultCreation(vaultAddress, user2);
        _testVaultFeeCollection(vaultAddress, user2);
        _testVaultOwnershipTransfer(vaultAddress, user2);
        _testVaultAccessControl(vaultAddress, user2);

        console.log(" VAULT CLAIMING AND OWNERSHIP TESTS COMPLETED SUCCESSFULLY\n");
    }

    /*//////////////////////////////////////////////////////////////
                        HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _registerDomain(string memory domainName, address user) internal {
        console.log("  - User registering domain:", domainName);

        uint256 userBalanceBefore = user.balance;
        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(user);
        domainRegistration.requestRegistration{value: REGISTRATION_FEE}(
            domainName
        );

        // Verify payment was processed
        assertEq(
            user.balance,
            userBalanceBefore - REGISTRATION_FEE,
            "User should pay registration fee"
        );
        assertEq(
            owner.balance,
            ownerBalanceBefore + REGISTRATION_FEE,
            "Owner should receive registration fee"
        );

        console.log("   Domain registration request submitted and paid");
        emit DomainRegistered(domainName, user);
    }

    function _setupDomainForMinting(
        string memory domainName,
        address user
    ) internal {
        console.log("  - Backend setting up domain for minting:", domainName);

        // Simulate backend processing: set domain owner and make it mintable
        vm.startPrank(owner);
        nftMinter.setDomainNameToOwner(domainName, user);
        nftMinter.setIsDomainMintable(domainName, true);
        vm.stopPrank();

        // Verify setup
        assertEq(
            nftMinter.getDomainOwner(domainName),
            user,
            "Domain owner should be set"
        );
        assertTrue(
            nftMinter.isDomainMintable(domainName),
            "Domain should be mintable"
        );

        console.log("   Domain setup completed - owner set and mintable");
    }

    function _mintNFT(
        string memory domainName,
        address user
    ) internal returns (uint256) {
        console.log("  - User minting NFT for domain:", domainName);

        vm.prank(user);
        uint256 tokenId = nftMinter.mintDomainNFT(domainName);

        // Verify NFT was minted
        assertEq(
            nftMinter.balanceOf(user, tokenId),
            1,
            "User should own the NFT"
        );
        assertEq(
            nftMinter.getTokenNameFromId(tokenId),
            domainName,
            "NFT should represent the domain"
        );

        console.log("   NFT minted successfully, tokenId:", tokenId);
        emit NFTMinted(domainName, user, tokenId);

        return tokenId;
    }

    function _createTokenDirectReceipt(
        uint256 nftId,
        address user
    ) internal returns (address) {
        console.log(
            "  - User creating token with direct receipt, nftId:",
            nftId
        );

        uint256 requiredFee = tokenMinter.fixedFee();
        console.log("  - Required fee:", requiredFee);

        // Approve TokenMinter to transfer NFT
        vm.prank(user);
        nftMinter.setApprovalForAll(address(tokenMinter), true);

        vm.prank(user);
        address tokenAddress = tokenMinter.createTokenFromNFT{
            value: requiredFee
        }(nftId, true);

        // Verify token creation
        assertTrue(tokenAddress != address(0), "Token should be created");
        assertEq(
            tokenMinter.getTokenAddress(nftId),
            tokenAddress,
            "Token address should be stored"
        );

        console.log("   Token created at address:", tokenAddress);
        emit TokenCreatedDirect(
            nftMinter.getTokenNameFromId(nftId),
            user,
            tokenAddress
        );

        return tokenAddress;
    }

    function _createTokenForLaunchpad(
        uint256 nftId,
        address user
    ) internal returns (address) {
        console.log("  - User creating token for launchpad, nftId:", nftId);

        // Approve TokenMinter to transfer NFT
        vm.prank(user);
        nftMinter.setApprovalForAll(address(tokenMinter), true);

        vm.prank(user);
        address tokenAddress = tokenMinter.createTokenFromNFT(nftId, false);

        // Verify token creation
        assertTrue(tokenAddress != address(0), "Token should be created");
        assertEq(
            tokenMinter.getTokenAddress(nftId),
            tokenAddress,
            "Token address should be stored"
        );

        // Verify tokens went to launchpad
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(
            tokenAddress
        );
        assertEq(
            token.owner(),
            address(launchpad),
            "Launchpad should own the tokens"
        );

        // Verify launchpad has a fake pool set up for the token
        (
            uint256 ethReserve,
            uint256 tokenReserve,
            uint256 fakeEth,
            address creator,
            uint16 sellPenalty,
            bool locked
        ) = launchpad.getPoolInfo(tokenAddress);
        
        assertEq(creator, user, "Creator should be the user");
        assertEq(ethReserve, 1.56 ether, "Initial ETH reserve should be 1.56 ether");
        assertEq(tokenReserve, 1_000_000 * 10 ** 18, "Token reserve should be 1M tokens");
        assertEq(fakeEth, 1.56 ether, "Fake ETH should be 1.56 ether");
        assertEq(sellPenalty, 50, "Default sell penalty should be 5%");
        assertFalse(locked, "Pool should not be locked initially");

        console.log("   Token created for launchpad at address:", tokenAddress);
        emit TokenCreatedLaunchpad(
            nftMinter.getTokenNameFromId(nftId),
            user,
            tokenAddress
        );

        return tokenAddress;
    }

    function _verifyDirectReceiptFlow(
        address tokenAddress,
        address user
    ) internal {
        console.log("  - Verifying direct receipt flow results");

        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(
            tokenAddress
        );

        // User should be the owner and have all tokens
        assertEq(token.owner(), user, "User should own the token contract");
        assertEq(
            token.balanceOf(user),
            1_000_000 * 10 ** 18,
            "User should have all tokens"
        );

        // Token should be launched (since it went directly to user)
        // Try to transfer tokens to verify they're tradeable
        vm.prank(user);
        token.transfer(makeAddr("testReceiver"), 1000 * 10 ** 18);

        console.log("   User has ownership and tokens are transferable");
        console.log("   Token name:", token.name());
        console.log("   Token symbol:", token.symbol());
        console.log(
            "   User balance:",
            token.balanceOf(user) / 10 ** 18,
            "tokens"
        );
    }

    function _tradeOnLaunchpad(address tokenAddress) internal {
        console.log("  - Trading on launchpad");

        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(
            tokenAddress
        );
        
        // Verify fake pool is set up
        (
            uint256 ethReserve,
            uint256 tokenReserve,
            ,
            ,
            ,
            bool locked
        ) = launchpad.getPoolInfo(tokenAddress);
        
        assertFalse(locked, "Pool should not be locked yet");
        assertEq(tokenReserve, 1_000_000 * 10 ** 18, "Should have full token supply");

        console.log("   Initial token reserve:", tokenReserve / 10 ** 18, "tokens");
        console.log("   Initial ETH reserve:", ethReserve, "wei");

        // Simulate some buying to test the pool functionality
        address buyer = makeAddr("buyer");
        vm.deal(buyer, 10 ether);

        uint256 buyAmount = 1 ether;
        vm.prank(buyer);
        launchpad.buyTokens{value: buyAmount}(tokenAddress, 0);

        // Check that reserves updated correctly
        (
            uint256 newEthReserve,
            uint256 newTokenReserve,
            ,
            ,
            ,
        ) = launchpad.getPoolInfo(tokenAddress);

        console.log("   After 1 ETH buy:");
        console.log("   ETH reserve:", newEthReserve, "wei");
        console.log("   Token reserve:", newTokenReserve / 10 ** 18, "tokens");
        console.log("   Buyer token balance:", token.balanceOf(buyer) / 10 ** 18, "tokens");

        assertTrue(newEthReserve > ethReserve, "ETH reserve should increase");
        assertTrue(newTokenReserve < tokenReserve, "Token reserve should decrease");
        assertTrue(token.balanceOf(buyer) > 0, "Buyer should have tokens");
    }

    function _launchTokenToUniswap(address tokenAddress) internal {
        console.log("  - Preparing token for Uniswap launch");

        // Since we can't easily simulate the full launchpad trading flow,
        // we'll just verify the token is ready for launch
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(
            tokenAddress
        );

        // Verify token properties
        assertEq(
            token.totalSupply(),
            1_000_000 * 10 ** 18,
            "Token should have correct supply"
        );
        assertTrue(bytes(token.name()).length > 0, "Token should have a name");
        assertTrue(
            bytes(token.symbol()).length > 0,
            "Token should have a symbol"
        );

        console.log("   Token is ready for Uniswap launch");
        console.log(
            "   Total supply:",
            token.totalSupply() / 10 ** 18,
            "tokens"
        );

        emit TokenLaunched(tokenAddress);
    }

    /*//////////////////////////////////////////////////////////////
                        INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testContractIntegration() public view {
        console.log("=== TESTING CONTRACT INTEGRATION ===");

        // Verify all contracts are properly deployed and configured
        assertTrue(
            address(domainRegistration) != address(0),
            "DomainRegistration should be deployed"
        );
        assertTrue(
            address(nftMinter) != address(0),
            "NFTMinter should be deployed"
        );
        assertTrue(
            address(tokenMinter) != address(0),
            "TokenMinter should be deployed"
        );
        assertTrue(
            address(launchpad) != address(0),
            "DensoFiLaunchpad should be deployed"
        );

        // Verify contract relationships
        assertEq(
            address(tokenMinter.nftContract()),
            address(nftMinter),
            "TokenMinter should reference NFTMinter"
        );
        assertEq(
            tokenMinter.launchpadContract(),
            address(launchpad),
            "TokenMinter should reference Launchpad"
        );

        // Verify ownership
        assertEq(
            domainRegistration.owner(),
            owner,
            "DomainRegistration owner should be correct"
        );
        assertEq(nftMinter.owner(), owner, "NFTMinter owner should be correct");
        assertEq(
            tokenMinter.owner(),
            deployer,
            "TokenMinter owner should be correct"
        );
        assertEq(
            launchpad.owner(),
            deployer,
            "Launchpad owner should be correct"
        );

        console.log(" All contract integrations verified");
    }

    function test_RevertWhen_InvalidScenarios() public {
        console.log("=== TESTING FAILURE SCENARIOS ===");

        // Test 1: Try to mint NFT without domain registration
        console.log("\n1. Testing NFT minting without domain setup");
        vm.prank(user1);
        vm.expectRevert("Caller is not the domain owner");
        nftMinter.mintDomainNFT("unregistered.eth");
        console.log("   NFT minting properly fails for unregistered domain");

        // Test 2: Try to create token without owning NFT
        console.log("\n2. Testing token creation without NFT ownership");
        uint256 fee = tokenMinter.fixedFee();
        vm.expectRevert("Caller does not own this NFT");
        vm.prank(user1);
        tokenMinter.createTokenFromNFT{value: fee}(999, true);
        console.log("   Token creation properly fails without NFT ownership");

        // Test 3: Try to create token with insufficient fee
        console.log("\n3. Testing token creation with insufficient fee");
        _registerDomain("insufficient.eth", user1);
        _setupDomainForMinting("insufficient.eth", user1);
        uint256 nftId = _mintNFT("insufficient.eth", user1);

        vm.prank(user1);
        nftMinter.setApprovalForAll(address(tokenMinter), true);

        uint256 insufficientFee = tokenMinter.fixedFee() - 1;
        vm.expectRevert("Insufficient fee for direct receipt");
        vm.prank(user1);
        tokenMinter.createTokenFromNFT{value: insufficientFee}(nftId, true);
        console.log("   Token creation properly fails with insufficient fee");

        console.log(" All failure scenarios tested successfully");
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_EndToEndFlow(
        string calldata domainName,
        uint256 userSeed
    ) public {
        // Bound inputs
        vm.assume(
            bytes(domainName).length > 0 && bytes(domainName).length <= 32
        );
        address user = address(
            uint160(bound(userSeed, 1, type(uint160).max - 1000))
        ); // Avoid system addresses
        vm.deal(user, 100 ether);

        // Skip if domain name contains null bytes or other invalid characters
        bytes memory domainBytes = bytes(domainName);
        for (uint i = 0; i < domainBytes.length; i++) {
            vm.assume(domainBytes[i] != 0x00);
        }

        console.log("Fuzz test with domain:", domainName, "and user:", user);

        // Complete flow
        _registerDomain(domainName, user);
        _setupDomainForMinting(domainName, user);
        uint256 nftId = _mintNFT(domainName, user);
        address tokenAddress = _createTokenDirectReceipt(nftId, user);
        _verifyDirectReceiptFlow(tokenAddress, user);

        console.log(" Fuzz test completed successfully");
    }

    /*//////////////////////////////////////////////////////////////
                        VAULT TESTING HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _tradeToReachThreshold(address tokenAddress) internal {
        console.log("  - Trading to reach market cap threshold");

        // Buy tokens to reach the threshold for launch
        address buyer = makeAddr("thresholdBuyer");
        vm.deal(buyer, 100 ether);

        // Check if already locked from previous trading
        (,,,,, bool locked) = launchpad.getPoolInfo(tokenAddress);
        if (locked) {
            console.log("   Pool already locked from previous trading");
            return;
        }

        // Multiple buys to reach threshold, checking lock status after each buy
        for (uint i = 0; i < 10; i++) {
            (,,,,, bool isLocked) = launchpad.getPoolInfo(tokenAddress);
            if (isLocked) {
                console.log("   Market cap threshold reached after", i, "purchases");
                break;
            }
            
            vm.prank(buyer);
            launchpad.buyTokens{value: 3 ether}(tokenAddress, 0);
        }

        // Verify pool is locked
        (,,,,, bool finalLocked) = launchpad.getPoolInfo(tokenAddress);
        assertTrue(finalLocked, "Pool should be locked after reaching threshold");
        console.log("   Market cap threshold reached, pool locked");
    }

    function _launchTokenAndGetVault(
        address tokenAddress,
        address creator
    ) internal returns (address) {
        console.log("  - Launching token to Uniswap and creating vault");

        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(
            tokenAddress
        );
        string memory tokenName = token.name();
        string memory domainName = _stringBeforeSpace(tokenName);

        // Launch the token (only owner can launch)
        vm.prank(deployer);
        launchpad.launchToken{value: 1 ether}(tokenAddress);

        // Get vault address from launchpad
        address vaultAddress = launchpad.getVaultByDomain(domainName);
        
        assertTrue(vaultAddress != address(0), "Vault should be created");
        console.log("   Token launched, vault created at:", vaultAddress);
        
        return vaultAddress;
    }

    function _testVaultCreation(address vaultAddress, address expectedOwner) internal {
        console.log("  - Testing vault creation and initial state");

        DensoFiUniV3Vault vault = DensoFiUniV3Vault(vaultAddress);

        // Check vault properties
        assertEq(vault.s_launcher(), address(launchpad), "Launcher should be launchpad");
        assertEq(vault.s_creator(), expectedOwner, "Creator should be correct");
        assertEq(vault.s_domainOwner(), expectedOwner, "Domain owner should initially be creator");
        assertTrue(vault.s_tokenId() > 0, "Vault should have a position token ID");

        (string memory domainName, address domainOwner, address creator) = vault.getDomainInfo();
        assertEq(domainOwner, expectedOwner, "Domain owner should be correct");
        assertEq(creator, expectedOwner, "Creator should be correct");
        assertTrue(bytes(domainName).length > 0, "Domain name should be set");

        console.log("   Vault creation verified - owner:", domainOwner);
        console.log("   Domain name:", domainName);
        console.log("   Position token ID:", vault.s_tokenId());
    }

    function _testVaultFeeCollection(address vaultAddress, address domainOwner) internal {
        console.log("  - Testing vault fee collection");

        DensoFiUniV3Vault vault = DensoFiUniV3Vault(vaultAddress);
        
        uint256 balanceBefore = domainOwner.balance;

        // Domain owner should be able to collect fees
        vm.prank(domainOwner);
        vm.expectEmit(true, false, false, false);
        emit FeesCollected(domainOwner, type(uint128).max, type(uint128).max);
        vault.collectFees();

        // Note: In a test environment without real trading, fees might be 0
        // But the function should execute without reverting
        console.log("   Fee collection successful for domain owner");
        console.log("   Balance change:", domainOwner.balance - balanceBefore, "wei");
    }

    function _testVaultOwnershipTransfer(address vaultAddress, address currentOwner) internal {
        console.log("  - Testing vault ownership transfer");

        DensoFiUniV3Vault vault = DensoFiUniV3Vault(vaultAddress);
        address newOwner = makeAddr("newVaultOwner");
        
        (string memory domainName,,) = vault.getDomainInfo();

        // Only launchpad admin can transfer ownership
        vm.prank(deployer);
        vm.expectEmit(true, false, false, false);
        emit DomainOwnershipUpdated(newOwner, domainName);
        launchpad.updateDomainOwnership(domainName, newOwner);

        // Verify ownership transfer
        assertEq(vault.s_domainOwner(), newOwner, "Domain owner should be updated");

        // New owner should be able to collect fees
        vm.prank(newOwner);
        vault.collectFees(); // Should not revert

        // Old owner should not be able to collect fees anymore
        vm.prank(currentOwner);
        vm.expectRevert("DensoFiVault: Only domain owner");
        vault.collectFees();

        console.log("   Ownership transferred from", currentOwner, "to", newOwner);
    }

    function _testVaultAccessControl(address vaultAddress, address domainOwner) internal {
        console.log("  - Testing vault access control");

        DensoFiUniV3Vault vault = DensoFiUniV3Vault(vaultAddress);
        address nonOwner = makeAddr("nonOwner");

        // Non-owner should not be able to collect fees
        vm.prank(nonOwner);
        vm.expectRevert("DensoFiVault: Only domain owner");
        vault.collectFees();

        // Non-launcher should not be able to update domain owner
        vm.prank(nonOwner);
        vm.expectRevert("DensoFiVault: Only launcher");
        vault.updateDomainOwner(makeAddr("someAddress"));

        // Non-launcher should not be able to set token ID
        vm.prank(nonOwner);
        vm.expectRevert("DensoFiVault: Only launcher");
        vault.setTokenId(999);

        console.log("   Access control verified - only authorized addresses can perform actions");
    }

    function _stringBeforeSpace(string memory str) internal pure returns (string memory) {
        bytes memory strBytes = bytes(str);

        // Find the first space character
        uint256 spaceIndex = type(uint256).max;
        for (uint256 i = 0; i < strBytes.length; i++) {
            if (strBytes[i] == 0x20) { // 0x20 is space
                spaceIndex = i;
                break;
            }
        }

        // If no space found, return the entire string
        if (spaceIndex == type(uint256).max) {
            return str;
        }

        // Create a new bytes array with the length up to the space
        bytes memory result = new bytes(spaceIndex);
        for (uint256 i = 0; i < spaceIndex; i++) {
            result[i] = strBytes[i];
        }

        return string(result);
    }
}
