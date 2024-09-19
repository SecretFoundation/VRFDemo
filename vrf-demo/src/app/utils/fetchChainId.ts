import { useState, useEffect } from "react";
import { ethers } from "ethers";

export const useFetchChainId = () => {
  const [chainId, setChainId] = useState<string>("");

  useEffect(() => {
    const handleChainChanged = (_chainId: string) => {
      const numericChainId = parseInt(_chainId, 16);
      setChainId(numericChainId.toString());
      console.log("Network changed to chain ID:", numericChainId);
    };

    const initEthereum = async () => {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum as any);

        // Setup chainChanged listener
        (window.ethereum as any).on("chainChanged", handleChainChanged);

        // Fetch initial chain ID on page load
        const { chainId } = await provider.getNetwork();
        setChainId(chainId.toString());
        console.log("Current Chain ID:", chainId);
      } else {
        console.error("MetaMask is not installed");
      }
    };

    // Initialize Ethereum provider
    initEthereum();

    // Cleanup function to remove listener
    return () => {
      if (window.ethereum) {
        (window.ethereum as any).removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  return chainId;
};
