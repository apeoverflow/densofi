import { useAccount, useEnsName, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'viem/chains'; 

/**
 * Custom hook for wallet connection status and network management
 */
export function useWalletConnection() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const { data: ensName } = useEnsName({ address });
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingNetwork } = useSwitchChain();

  // Check if user is on the correct network (Sepolia)
  const isCorrectNetwork = chainId === sepolia.id;

  // Switch to Sepolia if on a different network
  const switchToSepolia = () => {
    if (switchChain) {
      switchChain({ chainId: sepolia.id });
    }
  };

  // Get a shortened address display
  const displayAddress = ensName || (address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '');

  return {
    // Connection state
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    
    // Network state
    currentChain: { id: chainId },
    isCorrectNetwork,
    isSwitchingNetwork,
    switchToSepolia,
    
    // Display
    displayAddress,
    ensName,
  };
}