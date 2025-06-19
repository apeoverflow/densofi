import { type Abi } from "viem";

import { ENV } from "./env.js";

import sepoliaContractAddresses from "../constants/deployment-addresses/11155111-addresses.json" with { type: "json" };
import flowContractAddresses from "../constants/deployment-addresses/747-addresses.json" with { type: "json" };

import domainRegistrationAbi from "../constants/abis/DomainRegistration.json" with { type: "json" };
import nftMinterAbi from "../constants/abis/NFTMinter.json" with { type: "json" };
import tokenMinterAbi from "../constants/abis/TokenMinter.json" with { type: "json" };
import launchpadAbi from "../constants/abis/DensoFiLaunchpad.json" with { type: "json" };

const chainId = ENV.CHAIN_ID;

type ContractAddresses = {
  chainId: number;
  deployer: string;
  addresses: {
    domainRegistration: string;
    nftMinter: string;
    tokenMinter: string;
    launchpad: string;
  };
  parameters: {
    domainRegistrationFee: string;
    uniV3Router: string;
    uniV3Factory: string;
    nonfungiblePositionManager: string;
    weth: string;
    pythOracle: string;
    ethUsdPriceId: string;
    tokenMinterFixedFee: string;
  };
};

export const CONTRACT_ADDRESSES: ContractAddresses | {} = 
  chainId === "11155111" 
  ? sepoliaContractAddresses 
  : chainId === "747" 
  ? flowContractAddresses 
  : {};


export const DOMAIN_REGISTRATION_ABI = domainRegistrationAbi as Abi; 
export const NFT_MINTER_ABI = nftMinterAbi as Abi;
export const TOKEN_MINTER_ABI = tokenMinterAbi as Abi;
export const LAUNCHPAD_ABI = launchpadAbi as Abi; 