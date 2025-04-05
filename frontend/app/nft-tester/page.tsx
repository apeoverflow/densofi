'use client';

import { useState } from 'react';
import { useNFTMinterContract } from '@/hooks/useNFTMinterContract';
import { useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { NFT_MINTER_ABI, NFT_MINTER_SEPOLIA_ADDRESS } from '@/constants/contract';
import { GlassCard } from '@/components/ui/GlassCard';

export default function NFTMinterTester() {
  const { address, isConnected } = useAccount();
  const [name, setName] = useState('');
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [lookupTokenId, setLookupTokenId] = useState<number | null>(null);
  const { mintNFT, mintNFTViaResolver, isProcessing, transactionCompleted, transactionHash, writeError, isConfirmed } = useNFTMinterContract();

  // Read contract data
  const { data: tokenName, isLoading: nameLoading, refetch: refetchName } = useReadContract({
    address: NFT_MINTER_SEPOLIA_ADDRESS,
    abi: NFT_MINTER_ABI,
    functionName: 'tokenName',
    args: lookupTokenId !== null ? [lookupTokenId] : undefined,
    enabled: lookupTokenId !== null,
  });

  const handleMintNFT = async () => {
    if (!name) return;
    const success = await mintNFT(name);
    if (success) {
      setName('');
    }
  };

  const handleMintNFTViaResolver = async () => {
    if (!name) return;
    const success = await mintNFTViaResolver(name);
    if (success) {
      setName('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-purple-900 to-black">
      <h1 className="text-3xl font-bold mb-8 text-white">NFT Minter Contract Tester</h1>
      
      {!isConnected ? (
        <GlassCard className="w-full max-w-md p-6">
          <p className="text-center text-white">Please connect your wallet to interact with the contract.</p>
        </GlassCard>
      ) : (
        <div className="w-full max-w-2xl space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Mint NFT</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                  Domain Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter domain name"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={handleMintNFT}
                  disabled={isProcessing || !name}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md text-white font-medium transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Mint NFT'}
                </button>
                
                <button
                  onClick={handleMintNFTViaResolver}
                  disabled={isProcessing || !name}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md text-white font-medium transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Mint via Resolver'}
                </button>
              </div>
              
              {writeError && (
                <div className="p-3 bg-red-900 bg-opacity-50 border border-red-800 rounded-md text-red-200">
                  <p className="text-sm">Error: {writeError.message}</p>
                </div>
              )}

              {transactionHash && (
                <div className="p-3 bg-gray-800 border border-gray-700 rounded-md">
                  <p className="text-sm font-medium text-gray-300 mb-1">Transaction Hash:</p>
                  <p className="text-xs text-gray-400 break-all font-mono">{transactionHash}</p>
                </div>
              )}

              {isConfirmed && (
                <div className="p-3 bg-green-900 bg-opacity-50 border border-green-800 rounded-md text-green-200">
                  <p className="text-sm">Transaction confirmed!</p>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Read Token Name</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="lookupTokenId" className="block text-sm font-medium text-gray-300 mb-1">
                  Token ID
                </label>
                <input
                  type="number"
                  id="lookupTokenId"
                  onChange={(e) => setLookupTokenId(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Enter token ID"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                />
              </div>
              
              <button
                onClick={() => refetchName()}
                disabled={lookupTokenId === null}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-md text-white font-medium transition-colors"
              >
                Get Token Name
              </button>
              
              {nameLoading ? (
                <p className="text-gray-400">Loading...</p>
              ) : tokenName ? (
                <div className="p-3 bg-gray-800 border border-gray-700 rounded-md">
                  <p className="text-sm font-medium text-gray-300 mb-1">Token Name:</p>
                  <p className="text-lg text-white">{tokenName as string}</p>
                </div>
              ) : lookupTokenId !== null && (
                <p className="text-gray-400">No data found for this token ID</p>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}