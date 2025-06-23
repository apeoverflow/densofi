"use client";

import { useState } from "react";
import { useNFTMinterContract } from "@/hooks/useNFTMinterContract";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useAccount } from "wagmi";

export default function NFTMinterClient() {
  const { address, isConnected } = useAccount();
  const [domainName, setDomainName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [transactionHash, setTransactionHash] = useState("");
  const [mintMethod, setMintMethod] = useState<"standard" | "resolver">("standard");

  const { 
    mintNFT, 
    mintNFTViaResolver, 
    isProcessing, 
    isConfirmed,
    transactionHash: hash,
    writeError
  } = useNFTMinterContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainName) return;

    let success = false;
    if (mintMethod === "standard") {
      success = await mintNFT(domainName);
    } else {
      success = await mintNFTViaResolver(domainName);
    }

    if (success && hash) {
      setTransactionHash(hash);
      setShowSuccess(true);
    }
  };

  const resetForm = () => {
    setDomainName("");
    setShowSuccess(false);
    setTransactionHash("");
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-md p-8 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold mb-6">Connect Wallet</h2>
        <p className="mb-6 text-gray-300">Please connect your wallet to mint domain NFTs.</p>
        <WalletConnectButton />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-md p-8 rounded-xl shadow-xl">
      {showSuccess ? (
        <div className="text-center">
          <div className="mb-4 text-green-400 text-5xl">🎉</div>
          <h3 className="text-xl font-bold mb-2">NFT Minted Successfully!</h3>
          <p className="mb-4 text-gray-300">Your domain NFT for <span className="font-bold">{domainName}</span> has been minted.</p>
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
            <a 
              href={`https://evm.flowscan.io/tx/${transactionHash}`}
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
            Mint Another NFT
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-6">Mint Domain NFT</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Mint Method</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mintMethod"
                  checked={mintMethod === "standard"}
                  onChange={() => setMintMethod("standard")}
                  className="mr-2"
                />
                <span>Standard (Admin)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mintMethod"
                  checked={mintMethod === "resolver"}
                  onChange={() => setMintMethod("resolver")}
                  className="mr-2"
                />
                <span>Via Resolver</span>
              </label>
            </div>
            {mintMethod === "resolver" && (
              <p className="text-xs text-gray-400 mt-2">
                Note: You must own the ENS domain to mint via resolver
              </p>
            )}
          </div>
          
          <div className="mb-6">
            <label htmlFor="domainName" className="block text-sm font-medium mb-2">
              Domain Name
            </label>
            <input
              id="domainName"
              type="text"
              value={domainName}
              onChange={(e) => setDomainName(e.target.value)}
              className="w-full p-3 bg-gray-700/50 rounded-md border border-gray-600 focus:border-purple-500 focus:outline-none"
              placeholder="example.eth"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || !domainName}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              isProcessing || !domainName
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700"
            } transition-colors`}
          >
            {isProcessing ? "Processing..." : "Mint NFT"}
          </button>
          
          {writeError && (
            <p className="mt-4 text-red-400 text-sm">
              Error: {writeError.message || "Failed to mint NFT"}
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