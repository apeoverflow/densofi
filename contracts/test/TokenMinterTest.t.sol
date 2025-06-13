// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "forge-std/Test.sol";
import "../src/TokenMinter.sol";
import "../src/NFTMinter.sol";
import "../src/libraries/StringBytes32.sol";
import {InitialSupplySuperchainERC20} from "../src/InitialSupplySuperchainERC20.sol";

contract TokenMinterTest is Test {
    using StringBytes32 for string;
    using StringBytes32 for bytes32;

    TokenMinter public tokenMinter;
    NFTMinter public nftMinter;
    address public owner;
    address public user1;
    address public user2;
    address public launchpadContract;

    // Test domain names
    string constant DOMAIN_1 = "example.com";
    string constant DOMAIN_2 = "test.eth";

    // Events to test
    event TokenCreated(
        uint256 indexed nftId,
        address tokenAddress,
        string tokenName,
        bool receivedDirectly,
        uint256 feeAmount
    );
    event NFTReceived(uint256 indexed tokenId, address from);
    event DirectReceiptFeeUpdated(uint256 newFee);
    event LaunchpadContractUpdated(address newLaunchpad);
    event ProceedsWithdrawn(address to, uint256 amount);

    function setUp() public {
        // Setup accounts
        owner = makeAddr("owner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        launchpadContract = makeAddr("launchpad");

        // Fund accounts
        vm.deal(owner, 10 ether);
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);

        // Deploy NFT contract
        vm.prank(owner);
        nftMinter = new NFTMinter(owner);

        // Deploy TokenMinter with launchpad
        vm.prank(owner);
        tokenMinter = new TokenMinter(
            owner,
            address(nftMinter),
            launchpadContract
        );

        // Setup NFT for user1
        vm.startPrank(owner);
        nftMinter.setDomainNameToOwner(DOMAIN_1, user1);
        nftMinter.setIsDomainMintable(DOMAIN_1, true);
        nftMinter.setDomainNameToOwner(DOMAIN_2, user2);
        nftMinter.setIsDomainMintable(DOMAIN_2, true);
        vm.stopPrank();

        // Mint NFTs for users
        vm.prank(user1);
        nftMinter.mintDomainNFT(DOMAIN_1);

        vm.prank(user2);
        nftMinter.mintDomainNFT(DOMAIN_2);

        // Grant approval for TokenMinter to transfer NFTs
        vm.prank(user1);
        nftMinter.setApprovalForAll(address(tokenMinter), true);

        vm.prank(user2);
        nftMinter.setApprovalForAll(address(tokenMinter), true);
    }

    /*//////////////////////////////////////////////////////////////
                          CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function testConstructor() public view {
        assertEq(address(tokenMinter.nftContract()), address(nftMinter));
        assertEq(tokenMinter.launchpadContract(), launchpadContract);
        assertEq(tokenMinter.owner(), owner);
        assertEq(tokenMinter.directReceiptFee(), 500); // 5% default
        assertEq(tokenMinter.proceeds(), 0);
    }

    /*//////////////////////////////////////////////////////////////
                      DIRECT RECEIPT TOKEN CREATION
    //////////////////////////////////////////////////////////////*/

    function testCreateTokenWithDirectReceipt() public {
        uint256 nftId = 1;
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();

        vm.prank(user1);
        address tokenAddress = tokenMinter.createTokenFromNFT{
            value: requiredFee
        }(nftId, true);

        // Verify token was created
        assertTrue(tokenAddress != address(0));
        assertEq(tokenMinter.getTokenAddress(nftId), tokenAddress);
        assertTrue(tokenMinter.usedNFTs(nftId));

        // Verify user1 owns the tokens
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(
            tokenAddress
        );
        assertEq(token.owner(), user1);
        assertEq(token.balanceOf(user1), 1_000_000 * 10 ** 18);

        // Verify creation details
        TokenMinter.TokenCreationDetails memory details = tokenMinter
            .getTokenCreationDetails(nftId);
        assertEq(details.creator, user1);
        assertTrue(details.receivedDirectly);
        assertEq(details.feeAmount, requiredFee);
        assertEq(details.creationTime, block.timestamp);

        // Verify fee was collected
        assertEq(tokenMinter.proceeds(), requiredFee);

        // Verify NFT was transferred
        assertEq(nftMinter.balanceOf(user1, nftId), 0);
        assertEq(nftMinter.balanceOf(address(tokenMinter), nftId), 1);
    }

    function testCreateTokenWithDirectReceiptInsufficientFee() public {
        uint256 nftId = 1;
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();
        uint256 insufficientFee = requiredFee - 1;

        vm.prank(user1);
        vm.expectRevert("Insufficient fee for direct receipt");
        tokenMinter.createTokenFromNFT{value: insufficientFee}(nftId, true);
    }

    function testCreateTokenWithDirectReceiptOverpayment() public {
        uint256 nftId = 1;
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();
        uint256 overpayment = requiredFee + 0.005 ether;

        vm.prank(user1);
        address tokenAddress = tokenMinter.createTokenFromNFT{
            value: overpayment
        }(nftId, true);

        // Verify token was created
        assertTrue(tokenAddress != address(0));

        // Verify full overpayment was collected as fee
        assertEq(tokenMinter.proceeds(), overpayment);

        // Verify creation details show overpayment
        TokenMinter.TokenCreationDetails memory details = tokenMinter
            .getTokenCreationDetails(nftId);
        assertEq(details.feeAmount, overpayment);
    }

    /*//////////////////////////////////////////////////////////////
                      LAUNCHPAD TOKEN CREATION
    //////////////////////////////////////////////////////////////*/

    function testCreateTokenForLaunchpad() public {
        uint256 nftId = 2;

        vm.prank(user2);
        address tokenAddress = tokenMinter.createTokenFromNFT(nftId, false);

        // Verify token was created
        assertTrue(tokenAddress != address(0));
        assertEq(tokenMinter.getTokenAddress(nftId), tokenAddress);
        assertTrue(tokenMinter.usedNFTs(nftId));

        // Verify launchpad owns the tokens
        InitialSupplySuperchainERC20 token = InitialSupplySuperchainERC20(
            tokenAddress
        );
        assertEq(token.owner(), launchpadContract);
        assertEq(token.balanceOf(launchpadContract), 1_000_000 * 10 ** 18);

        // Verify creation details
        TokenMinter.TokenCreationDetails memory details = tokenMinter
            .getTokenCreationDetails(nftId);
        assertEq(details.creator, user2);
        assertFalse(details.receivedDirectly);
        assertEq(details.feeAmount, 0);
        assertEq(details.creationTime, block.timestamp);

        // Verify no fee was collected
        assertEq(tokenMinter.proceeds(), 0);
    }

    function testCreateTokenForLaunchpadWithPayment() public {
        uint256 nftId = 2;

        vm.prank(user2);
        vm.expectRevert("No payment required for launchpad option");
        tokenMinter.createTokenFromNFT{value: 0.01 ether}(nftId, false);
    }

    function testCreateTokenForLaunchpadNoLaunchpadSet() public {
        // Deploy TokenMinter without launchpad
        vm.prank(owner);
        TokenMinter tokenMinterNoLaunchpad = new TokenMinter(
            owner,
            address(nftMinter),
            address(0)
        );

        uint256 nftId = 2;

        // Approve token minter to transfer NFT
        vm.prank(user2);
        nftMinter.setApprovalForAll(address(tokenMinterNoLaunchpad), true);

        vm.prank(user2);
        vm.expectRevert("Launchpad contract not set");
        tokenMinterNoLaunchpad.createTokenFromNFT(nftId, false);
    }

    /*//////////////////////////////////////////////////////////////
                          COMMON REVERT TESTS
    //////////////////////////////////////////////////////////////*/

    function testCreateTokenFromUsedNFT() public {
        uint256 nftId = 1;
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();

        // Use NFT once
        vm.prank(user1);
        tokenMinter.createTokenFromNFT{value: requiredFee}(nftId, true);

        // Try to use again - should fail because NFT is already used
        vm.prank(user1);
        vm.expectRevert("NFT already used to create a token");
        tokenMinter.createTokenFromNFT{value: requiredFee}(nftId, true);
    }

    function testCreateTokenFromNonOwnedNFT() public {
        uint256 nftId = 1; // owned by user1
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();

        vm.prank(user2); // user2 tries to use user1's NFT
        vm.expectRevert("ERC1155: caller is not token owner");
        tokenMinter.createTokenFromNFT{value: requiredFee}(nftId, true);
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function testSetDirectReceiptFee() public {
        uint256 newFee = 1000; // 10%

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit DirectReceiptFeeUpdated(newFee);
        tokenMinter.setDirectReceiptFee(newFee);

        assertEq(tokenMinter.directReceiptFee(), newFee);
    }

    function testSetDirectReceiptFeeRevertsForNonOwner() public {
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        tokenMinter.setDirectReceiptFee(1000);
    }

    function testSetDirectReceiptFeeRevertsForInvalidFee() public {
        vm.prank(owner);
        vm.expectRevert("Fee cannot exceed 100%");
        tokenMinter.setDirectReceiptFee(10001); // > 100%
    }

    function testSetLaunchpadContract() public {
        address newLaunchpad = makeAddr("newLaunchpad");

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit LaunchpadContractUpdated(newLaunchpad);
        tokenMinter.setLaunchpadContract(newLaunchpad);

        assertEq(tokenMinter.launchpadContract(), newLaunchpad);
    }

    function testSetLaunchpadContractRevertsForNonOwner() public {
        address newLaunchpad = makeAddr("newLaunchpad");

        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        tokenMinter.setLaunchpadContract(newLaunchpad);
    }

    function testWithdrawProceeds() public {
        uint256 nftId = 1;
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();

        // Generate some proceeds
        vm.prank(user1);
        tokenMinter.createTokenFromNFT{value: requiredFee}(nftId, true);

        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(owner);
        vm.expectEmit(true, true, true, true);
        emit ProceedsWithdrawn(owner, requiredFee);
        tokenMinter.withdrawProceeds();

        assertEq(tokenMinter.proceeds(), 0);
        assertEq(owner.balance - ownerBalanceBefore, requiredFee);
    }

    function testWithdrawProceedsRevertsForNonOwner() public {
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                user1
            )
        );
        tokenMinter.withdrawProceeds();
    }

    function testEmergencyWithdraw() public {
        // Send some ETH to contract
        vm.deal(address(tokenMinter), 1 ether);

        uint256 ownerBalanceBefore = owner.balance;
        uint256 contractBalance = address(tokenMinter).balance;

        vm.prank(owner);
        tokenMinter.emergencyWithdraw();

        assertEq(address(tokenMinter).balance, 0);
        assertEq(owner.balance - ownerBalanceBefore, contractBalance);
    }

    /*//////////////////////////////////////////////////////////////
                          GETTER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function testGetTokenAddress() public {
        uint256 nftId = 1;
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();

        vm.prank(user1);
        address tokenAddress = tokenMinter.createTokenFromNFT{
            value: requiredFee
        }(nftId, true);

        assertEq(tokenMinter.getTokenAddress(nftId), tokenAddress);
    }

    function testGetNFTName() public {
        uint256 nftId = 1;
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();

        vm.prank(user1);
        tokenMinter.createTokenFromNFT{value: requiredFee}(nftId, true);

        assertEq(tokenMinter.getNFTName(nftId), DOMAIN_1);
    }

    function testGetTokenCreationDetails() public {
        uint256 nftId = 1;
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();

        vm.prank(user1);
        tokenMinter.createTokenFromNFT{value: requiredFee}(nftId, true);

        TokenMinter.TokenCreationDetails memory details = tokenMinter
            .getTokenCreationDetails(nftId);
        assertEq(details.creator, user1);
        assertTrue(details.receivedDirectly);
        assertEq(details.feeAmount, requiredFee);
        assertEq(details.creationTime, block.timestamp);
    }

    function testCalculateDirectReceiptFee() public view {
        uint256 fee = tokenMinter.calculateDirectReceiptFee();
        assertEq(fee, 0.01 ether);
    }

    /*//////////////////////////////////////////////////////////////
                          INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function testMultipleTokenCreations() public {
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();

        // Create token with direct receipt
        vm.prank(user1);
        address token1 = tokenMinter.createTokenFromNFT{value: requiredFee}(
            1,
            true
        );

        // Create token for launchpad
        vm.prank(user2);
        address token2 = tokenMinter.createTokenFromNFT(2, false);

        // Verify both tokens exist and are different
        assertTrue(token1 != address(0));
        assertTrue(token2 != address(0));
        assertTrue(token1 != token2);

        // Verify ownership
        assertEq(InitialSupplySuperchainERC20(token1).owner(), user1);
        assertEq(
            InitialSupplySuperchainERC20(token2).owner(),
            launchpadContract
        );

        // Verify proceeds
        assertEq(tokenMinter.proceeds(), requiredFee);
    }

    function testReceiveETH() public {
        // Test that contract can receive ETH
        vm.deal(user1, 1 ether);

        vm.prank(user1);
        (bool success, ) = payable(address(tokenMinter)).call{value: 0.5 ether}(
            ""
        );
        assertTrue(success);
        assertEq(address(tokenMinter).balance, 0.5 ether);
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_SetDirectReceiptFee(uint256 newFee) public {
        newFee = bound(newFee, 0, 10000); // Valid range

        vm.prank(owner);
        tokenMinter.setDirectReceiptFee(newFee);

        assertEq(tokenMinter.directReceiptFee(), newFee);
    }

    function testFuzz_CreateTokenWithVariousFees(uint256 paymentAmount) public {
        uint256 requiredFee = tokenMinter.calculateDirectReceiptFee();
        paymentAmount = bound(paymentAmount, requiredFee, 10 ether);

        uint256 nftId = 1;

        vm.prank(user1);
        address tokenAddress = tokenMinter.createTokenFromNFT{
            value: paymentAmount
        }(nftId, true);

        assertTrue(tokenAddress != address(0));
        assertEq(tokenMinter.proceeds(), paymentAmount);

        TokenMinter.TokenCreationDetails memory details = tokenMinter
            .getTokenCreationDetails(nftId);
        assertEq(details.feeAmount, paymentAmount);
    }
}
