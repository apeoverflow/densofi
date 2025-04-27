const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TokenMinter", function () {
  let NFTMinter;
  let TokenMinter;
  let nftMinter;
  let tokenMinter;
  let owner;
  let addr1;
  let addr2;
  let MINTER_ROLE;
  let InitialSupplySuperchainERC20;

  beforeEach(async function () {
    // Get the contract factories
    NFTMinter = await ethers.getContractFactory("NFTMinter");
    TokenMinter = await ethers.getContractFactory("TokenMinter");
    InitialSupplySuperchainERC20 = await ethers.getContractFactory("InitialSupplySuperchainERC20");
    
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy the NFT contract
    nftMinter = await NFTMinter.deploy();
    await nftMinter.waitForDeployment();
    
    // Deploy the token minter contract
    tokenMinter = await TokenMinter.deploy(await nftMinter.getAddress());
    await tokenMinter.waitForDeployment();
    
    // Get the MINTER_ROLE bytes32 value
    MINTER_ROLE = await tokenMinter.MINTER_ROLE();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await tokenMinter.hasRole(await tokenMinter.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should assign the minter role to the owner", async function () {
      expect(await tokenMinter.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });

    it("Should set the correct NFT contract address", async function () {
      expect(await tokenMinter.nftContract()).to.equal(await nftMinter.getAddress());
    });
  });

  describe("Token Creation", function () {
    beforeEach(async function () {
      // Mint an NFT first
      await nftMinter.mint("TestNFT", 1);
    });

    it("Should create a token from an NFT", async function () {
      await tokenMinter.createTokenFromNFT(0);
      
      // Get the created token address
      const tokenAddress = await tokenMinter.getTokenAddress(0);
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
      
      // Create token instance
      const token = await ethers.getContractAt("InitialSupplySuperchainERC20", tokenAddress);
      
      // Check token properties
      expect(await token.name()).to.equal("TestNFT Token");
      expect(await token.symbol()).to.equal("TestNFTT");
      expect(await token.decimals()).to.equal(18);
      expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000"));
    });

    it("Should transfer NFT to the token minter contract", async function () {
      await tokenMinter.createTokenFromNFT(0);
      expect(await nftMinter.balanceOf(await tokenMinter.getAddress(), 0)).to.equal(1);
      expect(await nftMinter.balanceOf(owner.address, 0)).to.equal(0);
    });

    it("Should not allow creating a token from an NFT that doesn't exist", async function () {
      await expect(
        tokenMinter.createTokenFromNFT(999)
      ).to.be.revertedWith("Must own the NFT");
    });

    it("Should not allow creating a token from an NFT that's already been used", async function () {
      await tokenMinter.createTokenFromNFT(0);
      await expect(
        tokenMinter.createTokenFromNFT(0)
      ).to.be.revertedWith("NFT already used to create a token");
    });

    it("Should not allow non-minter to create a token", async function () {
      await expect(
        tokenMinter.connect(addr1).createTokenFromNFT(0)
      ).to.be.revertedWith("AccessControl:");
    });

    it("Should not allow creating a token from an NFT you don't own", async function () {
      // Transfer NFT to addr1
      await nftMinter.safeTransferFrom(owner.address, addr1.address, 0, 1, "0x");
      
      await expect(
        tokenMinter.createTokenFromNFT(0)
      ).to.be.revertedWith("Must own the NFT");
    });

    it("Should store the NFT name in the contract", async function () {
      await tokenMinter.createTokenFromNFT(0);
      expect(await tokenMinter.getStoredNFTName(0)).to.equal("TestNFT");
    });
  });

  describe("Token Retrieval", function () {
    it("Should return zero address for non-existent token", async function () {
      expect(await tokenMinter.getTokenAddress(0)).to.equal(ethers.ZeroAddress);
    });

    it("Should return correct token address after creation", async function () {
      await nftMinter.mint("TestNFT", 1);
      await tokenMinter.createTokenFromNFT(0);
      
      const tokenAddress = await tokenMinter.getTokenAddress(0);
      expect(tokenAddress).to.not.equal(ethers.ZeroAddress);
      
      const token = await ethers.getContractAt("InitialSupplySuperchainERC20", tokenAddress);
      expect(await token.name()).to.equal("TestNFT Token");
    });
  });
}); 