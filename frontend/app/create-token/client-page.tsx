"use client";

import { useState, useEffect } from "react";
import { useTokenMinterContract } from "@/hooks/useTokenMinterContract";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { useAccount, useReadContract } from "wagmi";
import { NFT_MINTER_ABI, NFT_MINTER_SEPOLIA_ADDRESS } from "@/constants/contract";

interface NFT {
  id: number;
  name: string;
}

export default function TokenMinterClient() {
  const { address, isConnected } = useAccount();
  const [selectedNftId, setSelectedNftId] = useState<number | null>(null);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdTokenAddress, setCreatedTokenAddress] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  const { 
    createTokenFromNFT, 
    isProcessing, 
    isConfirmed,
    transactionHash: hash,
    writeError
  } = useTokenMinterContract();

  // Load user's NFTs
  useEffect(() => {
    const loadUserNFTs = async () => {
      if (!isConnected || !address) return;
      
      setIsLoadingNFTs(true);
      try {
        // This is a simplified approach - in a real app, you'd want to use events or subgraphs
        // to find all NFTs owned by the user. For the demo, we'll just check NFTs with IDs 0-10.
        const potentialNFTs = Array.from({ length: 10 }, (_, i) => i);
        const nfts: NFT[] = [];
        
        for (const id of potentialNFTs) {
          const { data: balance } = await useReadContract({
            address: NFT_MINTER_SEPOLIA_ADDRESS,
            abi: NFT_MINTER_ABI,
            functionName: 'balanceOf',
            args: [address, id],
          });
          
          if (balance && (balance as bigint) > BigInt(0)) {
            const { data: name } = await useReadContract({
              address: NFT_MINTER_SEPOLIA_ADDRESS,
              abi: NFT_MINTER_ABI,
              functionName: 'tokenName',
              args: [id],
            });
            
            nfts.push({ id, name: name as string });
          }
        }
        
        setUserNFTs(nfts);
      } catch (error) {
        console.error("Error loading NFTs:", error);
      } finally {
        setIsLoadingNFTs(false);
      }
    };
    
    loadUserNFTs();
  }, [isConnected, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNftId === null) return;

    const success = await createTokenFromNFT(selectedNftId);

    if (success && hash) {
      // Get the created token address from the event logs
      // In a real app, you would parse the transaction receipt for the TokenCreated event
      const { data: tokenAddress } = await useReadContract({
        address: NFT_MINTER_SEPOLIA_ADDRESS,
        abi: NFT_MINTER_ABI,
        functionName: 'nftToToken',
        args: [selectedNftId],
      });
      
      setCreatedTokenAddress(tokenAddress as string);
      setTransactionHash(hash);
      setShowSuccess(true);
    }
  };

  const resetForm = () => {
    setSelectedNftId(null);
    setShowSuccess(false);
    setTransactionHash("");
    setCreatedTokenAddress("");
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-md bg-gray-800/50 backdrop-blur-md p-8 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold mb-6">Connect Wallet</h2>
        <p className="mb-6 text-gray-300">Please connect your wallet to create tokens from your NFTs.</p>
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
          <p className="mb-4 text-gray-300">Your ERC20 token has been created for the selected NFT.</p>
          
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-2">Token Address:</p>
            <a 
              href={`https://sepolia.etherscan.io/address/${createdTokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm break-all hover:underline"
            >
              {createdTokenAddress}
            </a>
          </div>
          
          <div className="mb-6">
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
          <h2 className="text-xl font-semibold mb-6">Create ERC20 Token</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Select Your Domain NFT
            </label>
            
            {isLoadingNFTs ? (
              <div className="text-center py-8">
                <p>Loading your NFTs...</p>
              </div>
            ) : userNFTs.length === 0 ? (
              <div className="bg-gray-700/30 p-4 rounded-md text-center">
                <p className="text-gray-300 mb-3">You don't have any domain NFTs yet.</p>
                <a 
                  href="/mint-nft"
                  className="text-purple-400 hover:text-purple-300 underline"
                >
                  Mint a domain NFT first
                </a>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {userNFTs.map((nft) => (
                  <label 
                    key={nft.id}
                    className={`block p-3 rounded-md cursor-pointer border ${
                      selectedNftId === nft.id
                        ? "border-purple-500 bg-purple-900/30"
                        : "border-gray-700 bg-gray-800/30 hover:bg-gray-700/30"
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="nftId"
                        value={nft.id}
                        checked={selectedNftId === nft.id}
                        onChange={() => setSelectedNftId(nft.id)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium">{nft.name}</p>
                        <p className="text-xs text-gray-400">ID: {nft.id}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isProcessing || selectedNftId === null || isLoadingNFTs}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              isProcessing || selectedNftId === null || isLoadingNFTs
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