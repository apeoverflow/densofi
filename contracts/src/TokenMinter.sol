// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./NFTMinter.sol";
import "src/libraries/StringBytes32.sol";
import {InitialSupplySuperchainERC20} from "./InitialSupplySuperchainERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IDensoFiLaunchpad {
    function acceptTokenFromMinter(
        address tokenAddress,
        address creator,
        uint16 sellPenalty
    ) external;
}

interface IDensoFiLaunchpadExtended {
    function createTokenFromMinter(
        address owner,
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupply
    ) external returns (InitialSupplySuperchainERC20);
}

/**
 * @title TokenMinter
 * @dev Contract that allows creating ERC20 tokens from NFTs
 *
 * This contract allows users with NFTs to create ERC20 tokens
 * based on NFTs they own. Users can choose to receive all tokens directly (with fee)
 * or send them to a launchpad contract.
 */
contract TokenMinter is IERC1155Receiver, Ownable, ReentrancyGuard {
    using StringBytes32 for string;
    using StringBytes32 for bytes32;

    // Reference to the NFT contract
    NFTMinter public nftContract;

    // Launchpad contract address
    address public launchpadContract;

    // Collected proceeds from fees
    uint256 public proceeds;

    uint256 public fixedFee = 0.01 ether;

    // Mapping to track which NFTs have been used to mint tokens
    mapping(uint256 => bool) public usedNFTs;

    // Mapping to store created token contracts
    mapping(uint256 => address) public nftToToken;

    // Mapping to store NFT names
    mapping(uint256 => string) private _nftNames;

    // Mapping to store token creation details
    mapping(uint256 => TokenCreationDetails) public tokenCreationDetails;

    // Default sell penalty for launchpad tokens (in basis points, 0-100 = 0-10%)
    uint16 public defaultSellPenalty = 50; // 5%

    struct TokenCreationDetails {
        address creator;
        bool receivedDirectly;
        uint256 feeAmount;
        uint256 creationTime;
    }

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
    event FixedFeeUpdated(uint256 newFee);
    event DefaultSellPenaltyUpdated(uint16 newPenalty);
    event TokenSentToLaunchpad(address indexed tokenAddress, address indexed creator);

    /**
     * @dev Constructor initializes the contract with the NFT contract address
     * @param deployer Address of the deployer
     * @param _nftContract Address of the NFTMinter contract
     * @param _launchpadContract Address of the launchpad contract (can be zero initially)
     */
    constructor(
        address deployer,
        address _nftContract,
        address _launchpadContract
    ) Ownable(deployer) {
        nftContract = NFTMinter(_nftContract);
        launchpadContract = _launchpadContract;
    }

    /**
     * @dev Creates a new Superchain ERC20 token based on an NFT
     * @param nftId The ID of the NFT to use as reference
     * @param receiveTokensDirectly If true, user receives all tokens directly (with fee). If false, tokens go to launchpad
     * @return tokenAddress The address of the created token contract
     *
     * Requirements:
     * - NFT must not have been used to create a token before
     * - Caller must own the NFT
     * - If receiveTokensDirectly is true, caller must pay the direct receipt fee
     * - If receiveTokensDirectly is false, launchpad contract must be set
     */
    function createTokenFromNFT(
        uint256 nftId,
        bool receiveTokensDirectly
    ) public payable nonReentrant returns (address tokenAddress) {
        require(!usedNFTs[nftId], "NFT already used to create a token");

        // Check if the caller owns the NFT
        require(
            nftContract.balanceOf(msg.sender, nftId) > 0,
            "Caller does not own this NFT"
        );

        // If sending to launchpad, ensure launchpad is set
        if (!receiveTokensDirectly) {
            require(
                launchpadContract != address(0),
                "Launchpad contract not set"
            );
        }

        string memory nftName = nftContract
            .s_tokenIdToDomainName(nftId)
            .bytes32ToString();
        string memory tokenName = string(abi.encodePacked(nftName, " Token"));
        string memory tokenSymbol = string(abi.encodePacked(nftName, "T"));

        // Store the NFT name before transfer
        _nftNames[nftId] = nftName;

        // Transfer the NFT to this contract and emit event
        nftContract.safeTransferFrom(msg.sender, address(this), nftId, 1, "");
        emit NFTReceived(nftId, msg.sender);

        uint256 feeAmount = 0;
        address tokenOwner;

        if (receiveTokensDirectly) {
            // Calculate and collect fee for direct receipt
            feeAmount = msg.value;
            uint256 requiredFee = fixedFee;
            require(
                feeAmount >= requiredFee,
                "Insufficient fee for direct receipt"
            );

            proceeds += feeAmount;
            tokenOwner = msg.sender;
        } else {
            // No fee required, tokens go to launchpad
            require(msg.value == 0, "No payment required for launchpad option");
            tokenOwner = launchpadContract;
        }

        // Create new Superchain ERC20 token with 1 million initial supply
        // If going to launchpad, we need to create it from launchpad context so launchpad becomes the launcher
        InitialSupplySuperchainERC20 newToken;
        
        if (receiveTokensDirectly) {
            // Direct receipt: create token normally with immediate launch
            newToken = new InitialSupplySuperchainERC20(
                tokenOwner, // owner receives the tokens
                tokenName, // name
                tokenSymbol, // symbol
                18, // decimals
                1_000_000 * 10 ** 18, // initial supply (1 million tokens with 18 decimals)
                block.chainid, // initial supply chain ID (current chain)
                true // should launch immediately
            );
        } else {
            // Launchpad: delegate token creation to launchpad so it becomes the launcher
            newToken = IDensoFiLaunchpadExtended(launchpadContract).createTokenFromMinter(
                tokenOwner,
                tokenName,
                tokenSymbol,
                1_000_000 * 10 ** 18
            );
        }

        tokenAddress = address(newToken);

        // Mark NFT as used
        usedNFTs[nftId] = true;

        // Store the token contract address
        nftToToken[nftId] = tokenAddress;

        // Store creation details
        tokenCreationDetails[nftId] = TokenCreationDetails({
            creator: msg.sender,
            receivedDirectly: receiveTokensDirectly,
            feeAmount: feeAmount,
            creationTime: block.timestamp
        });

        // If tokens went to launchpad, set up fake pool
        if (!receiveTokensDirectly) {
            IDensoFiLaunchpad(launchpadContract).acceptTokenFromMinter(
                tokenAddress,
                msg.sender,
                defaultSellPenalty
            );
            emit TokenSentToLaunchpad(tokenAddress, msg.sender);
        }

        emit TokenCreated(
            nftId,
            tokenAddress,
            tokenName,
            receiveTokensDirectly,
            feeAmount
        );

        return tokenAddress;
    }

    function setFixedFee(uint256 newFee) external onlyOwner {
        fixedFee = newFee;
        emit FixedFeeUpdated(newFee);
    }

    /**
     * @dev Sets the default sell penalty for launchpad tokens (owner only)
     * @param newPenalty The new sell penalty in basis points (0-100 = 0-10%)
     */
    function setDefaultSellPenalty(uint16 newPenalty) external onlyOwner {
        require(newPenalty <= 100, "Penalty too high"); // Max 10%
        defaultSellPenalty = newPenalty;
        emit DefaultSellPenaltyUpdated(newPenalty);
    }

    /**
     * @dev Returns the token contract address for a given NFT ID
     * @param nftId The ID of the token
     * @return The address of the token contract created from this NFT
     */
    function getTokenAddress(uint256 nftId) public view returns (address) {
        return nftToToken[nftId];
    }

    /**
     * @dev Returns the name of the NFT used to create a token
     * @param nftId The ID of the NFT
     * @return The name of the NFT
     */
    function getNFTName(uint256 nftId) public view returns (string memory) {
        return _nftNames[nftId];
    }

    /**
     * @dev Returns the creation details for a token
     * @param nftId The ID of the NFT used to create the token
     * @return The creation details struct
     */
    function getTokenCreationDetails(
        uint256 nftId
    ) public view returns (TokenCreationDetails memory) {
        return tokenCreationDetails[nftId];
    }

    /**
     * @dev Sets the launchpad contract address (owner only)
     * @param newLaunchpad The new launchpad contract address
     */
    function setLaunchpadContract(address newLaunchpad) external onlyOwner {
        launchpadContract = newLaunchpad;
        emit LaunchpadContractUpdated(newLaunchpad);
    }

    /**
     * @dev Withdraws collected proceeds (owner only)
     */
    function withdrawProceeds() external onlyOwner {
        uint256 amount = proceeds;
        proceeds = 0;
        payable(owner()).transfer(amount);
        emit ProceedsWithdrawn(owner(), amount);
    }

    /**
     * @dev Emergency withdraw function (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Required by IERC1155Receiver
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155Received.selector;
    }

    /**
     * @dev Required by IERC1155Receiver
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return IERC1155Receiver.onERC1155BatchReceived.selector;
    }

    /**
     * @dev Required by IERC1155Receiver
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public pure override returns (bool) {
        return
            interfaceId == type(IERC1155Receiver).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    /**
     * @dev Allow contract to receive ETH
     */
    receive() external payable {}
}
