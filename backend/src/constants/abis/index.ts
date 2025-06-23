import { type Abi } from "viem";

// Import ABIs from JSON files
import domainRegistrationAbi from './DomainRegistration.json' with { type: "json" };
import nftMinterAbi from './NFTMinter.json' with { type: "json" };
import tokenMinterAbi from './TokenMinter.json' with { type: "json" };

// Export ABIs
export const DOMAIN_REGISTRATION_ABI = domainRegistrationAbi as Abi;
export const NFT_MINTER_ABI = nftMinterAbi as Abi;
export const TOKEN_MINTER_ABI = tokenMinterAbi as Abi; 