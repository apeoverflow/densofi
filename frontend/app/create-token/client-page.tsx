"use client";

import { useState, useEffect } from "react";
import { useTokenMinterContract } from "@/hooks/useTokenMinterContract";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useAccount } from "wagmi";

// Alchemy API setup
const apiKey = "rpHRPKA38BMxeGGjtjkGTEAZc0nRtb9D";
const endpoint = `https://eth-sepolia.alchemyapi.io/v2/${apiKey}`;
import {NFT_MINTER_SEPOLIA_ADDRESS as CONTRACT_ADDRESS} from "../../constants/contract";

interface NFT {
  id: {
    tokenId: string;
  };
  title: string;
  description: string;
  media: Array<{
    gateway: string;
  }>;
  contract: {
    address: string;
  };
}

function TokenMinterClient() {
  const { address, isConnected } = useAccount();
  const [selectedNft, setSelectedNft] = useState<string>("");
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");

  const { 
    createTokenFromNFT, 
    isProcessing, 
    isConfirmed,
    transactionHash: hash,
    writeError
  } = useTokenMinterContract();

  // Fetch NFTs when address changes
  useEffect(() => {
    if (address) {
      setLoading(true);
      fetchNFTs(address, CONTRACT_ADDRESS, (fetchedNfts) => {
        setNfts(fetchedNfts);
        setLoading(false);
      }, 0);
    }
  }, [address]);

  const fetchNFTs = async (owner: string, contractAddress: string, setNFTsCallback: (nfts: NFT[]) => void, retryAttempt: number) => {
    if (retryAttempt === 5) {
      return;
    }
    if (owner) {
      let data;
      try {
        if (contractAddress) {
          data = await fetch(`${endpoint}/getNFTs?owner=${owner}&contractAddresses%5B%5D=${contractAddress}`).then(data => data.json())
        } else {
          data = await fetch(`${endpoint}/getNFTs?owner=${owner}`).then(data => data.json())
        }
      } catch (e) {
        fetchNFTs(owner, contractAddress, setNFTsCallback, retryAttempt+1);
        return;
      }

      setNFTsCallback(data.ownedNfts);
      return data;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNft) return;

    const nftIdNumber = parseInt(selectedNft, 10);
    if (isNaN(nftIdNumber)) return;

    const success = await createTokenFromNFT(nftIdNumber);

    if (success && hash) {
      setTransactionHash(hash);
      setShowSuccess(true);
    }
  };

  const resetForm = () => {
    setSelectedNft("");
    setShowSuccess(false);
    setTransactionHash("");
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-md p-8 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold mb-6">Connect Wallet</h2>
        <p className="mb-6 text-gray-300">Please connect your wallet to create tokens from domain NFTs.</p>
        <WalletConnectButton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-md p-8 rounded-xl shadow-xl">
      {showSuccess ? (
        <div className="text-center">
          <div className="mb-4 text-green-400 text-5xl">🎉</div>
          <h3 className="text-xl font-bold mb-2">Token Created Successfully!</h3>
          <p className="mb-4 text-gray-300">Your token for NFT ID <span className="font-bold">#{selectedNft}</span> has been created.</p>
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
            <a 
              href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm break-all hover:underline"
            >
              {transactionHash}
            </a>
          </div>
          <button
            onClick={resetForm}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            Create Another Token
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-6">Create Token from Domain NFT</h2>
          
          <div className="mb-6">
            <label htmlFor="nftSelector" className="block text-sm font-medium mb-2">
              Select Your Domain NFT
            </label>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-purple-500"></div>
              </div>
            ) : nfts.length === 0 ? (
              <div className="p-4 bg-gray-700/50 rounded-md border border-gray-600 text-center">
                <p className="text-gray-300">No domain NFTs found</p>
                <p className="text-xs text-gray-400 mt-2">
                  You need to own domain NFTs to create tokens
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-700/30 rounded-md border border-gray-600">
                {nfts.map((nft) => (
                  <div 
                    key={nft.id.tokenId}
                    onClick={() => setSelectedNft(nft.id.tokenId)}
                    className={`p-2 rounded-md cursor-pointer transition-all ${
                      selectedNft === nft.id.tokenId 
                        ? "bg-purple-600/40 border-purple-500 border" 
                        : "bg-gray-700/50 hover:bg-gray-700/70 border border-gray-600"
                    }`}
                  >
                    {nft.media && nft.media[0] ? (
                      <img 
                        src={nft.media[0].gateway} 
                        alt={nft.title || `NFT #${nft.id.tokenId}`}
                        className="w-full h-24 object-cover rounded-md mb-2"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-800 rounded-md mb-2 flex items-center justify-center">
                        <span className="text-xl">🏠</span>
                      </div>
                    )}
                    <p className="text-sm font-medium truncate">
                      {nft.title || `Domain #${nft.id.tokenId}`}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      ID: {nft.id.tokenId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || !selectedNft || loading}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              isProcessing || !selectedNft || loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            } transition-colors`}
          >
            {isProcessing ? "Processing..." : "Create Token"}
          </button>
          
          {writeError && (
            <p className="mt-4 text-red-400 text-sm">
              Error: {writeError.message || "Failed to create token"}
            </p>
          )}
          
          <p className="mt-4 text-xs text-gray-400">
            Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
          </p>
        </form>
      )}
    </div>
  );
}

export default TokenMinterClient;
