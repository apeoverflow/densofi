const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMinter", function () {
  let NFTMinter;
  let nftMinter;
  let owner;
  let addr1;
  let addr2;
  let MINTER_ROLE;

  beforeEach(async function () {
    // Get the contract factory
    NFTMinter = await ethers.getContractFactory("NFTMinter");
    
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy the contract
    nftMinter = await NFTMinter.deploy();
    await nftMinter.waitForDeployment();
    
    // Get the MINTER_ROLE bytes32 value
    MINTER_ROLE = await nftMinter.MINTER_ROLE();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftMinter.hasRole(await nftMinter.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should assign the minter role to the owner", async function () {
      expect(await nftMinter.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint NFT", async function () {
      await nftMinter.mint("TestNFT", 1);
      expect(await nftMinter.balanceOf(owner.address, 0)).to.equal(1);
      expect(await nftMinter.tokenName(0)).to.equal("TestNFT");
    });

    it("Should increment token ID counter", async function () {
      await nftMinter.mint("TestNFT1", 1);
      await nftMinter.mint("TestNFT2", 1);
      expect(await nftMinter.balanceOf(owner.address, 0)).to.equal(1);
      expect(await nftMinter.balanceOf(owner.address, 1)).to.equal(1);
      expect(await nftMinter.tokenName(0)).to.equal("TestNFT1");
      expect(await nftMinter.tokenName(1)).to.equal("TestNFT2");
    });

    it("Should not allow non-minter to mint NFT", async function () {
      await expect(
        nftMinter.connect(addr1).mint("TestNFT", 1)
      ).to.be.revertedWith("AccessControl:");
    });

    it("Should mint correct amount of tokens", async function () {
      await nftMinter.mint("TestNFT", 5);
      expect(await nftMinter.balanceOf(owner.address, 0)).to.equal(5);
    });
  });

  describe("URI", function () {
    it("Should return correct URI format", async function () {
      await nftMinter.mint("TestNFT", 1);
      expect(await nftMinter.uri(0)).to.equal("ipfs://0");
    });
  });
}); 