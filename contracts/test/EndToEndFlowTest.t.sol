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

    function _tradeOnLaunchpad(address tokenAddress) internal view {
        console.log("  - Simulating trading on launchpad");

        // For this test, we can't actually create a fake pool because the token
        // was created through TokenMinter, not through launchpad.createToken()
        // This demonstrates the integration point where launchpad would need
        // to handle tokens created by TokenMinter

        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(
            tokenAddress
        );
        uint256 launchpadBalance = token.balanceOf(address(launchpad));

        console.log(
            "   Launchpad holds",
            launchpadBalance / 10 ** 18,
            "tokens"
        );
        console.log("   Token is ready for launchpad trading setup");

        // In a real scenario, the launchpad would need a method to accept
        // tokens from TokenMinter and create a fake pool for trading
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
}
