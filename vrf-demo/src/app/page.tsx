'use client'

import { useState } from "react";
import { initializeWeb3Modal } from "./config/web3ModalConfig"; // Import the function
import { setupSubmit, subscribeToEvents } from "./functions/submit"; // Import the submit functions
import { BigNumber } from "bignumber.js";
import { useFetchChainId } from "./utils/fetchChainId"; // Import the fetchChainId hook

// Import the SVGs as React components
import Dice1 from './assets/1.svg';
import Dice2 from './assets/2.svg';
import Dice3 from './assets/3.svg';
import Dice4 from './assets/4.svg';
import Dice5 from './assets/5.svg';
import Dice6 from './assets/6.svg';

// Initialize Web3Modal
initializeWeb3Modal();

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [randomWords, setRandomWords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use the custom hook to get the current chain ID
  const chainId = useFetchChainId();

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      // Submit the transaction
      const { txHash, randomnessContract } = await setupSubmit();
      setTxHash(txHash);

      // Subscribe to contract events to get the random words
      await subscribeToEvents(txHash, randomnessContract, setRandomWords, setLoading);
    } catch (err) {
      setError("Transaction failed. Please try again.");
      setLoading(false);
    }
  };

  // Function to return the correct dice component based on the dice roll
  const getDiceComponent = (diceRoll: string) => {
    const style = { width: '25%', height: '25%' }; // Scale to 1/4 of the original size
    switch (diceRoll) {
      case '1': return <Dice1 style={style} />;
      case '2': return <Dice2 style={style} />;
      case '3': return <Dice3 style={style} />;
      case '4': return <Dice4 style={style} />;
      case '5': return <Dice5 style={style} />;
      case '6': return <Dice6 style={style} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 py-8">
      {/* Connect button */}
      <div className="w-full flex justify-end p-4">
        <w3m-button />
      </div>

      {/* Main content */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">Secret VRF on Ethereum</h1>
        <p className="mt-2 text-lg text-gray-600">Sample Application: Roll the Dice!</p>

        {/* Display the transaction hash */}
        {txHash && (
          <div className="mt-4">
            <p><b>Transaction Hash:</b> <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a></p>
          </div>
        )}

        {/* Display random words (dice rolls) */}
        {randomWords.length > 0 && (
          <div className="mt-4">
            <h3>Dice Rolls:</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              {randomWords.map((word, index) => {
                // Calculate the dice roll (1-6)
                const diceRoll = new BigNumber(word.toString()).modulo(6).plus(1).toString();

                // Render the correct dice image
                return (
                  <div key={index} className="flex flex-col items-center">
              
                    {getDiceComponent(diceRoll)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Display loading indicator */}
        {loading && (
          <div className="mt-4">
            <p>Rolling the dice... Please wait.</p>
          </div>
        )}

        {/* Display error */}
        {error && (
          <div className="mt-4 text-red-500">
            <p>{error}</p>
          </div>
        )}

        {/* Roll the dice button */}
        <div className="mt-8">
          <button
            onClick={handleClick}
            className="px-6 py-3 rounded-full border border-gray-300 hover:border-blue-500 text-gray-700 transition"
            disabled={loading}
          >
            {loading ? "Rolling..." : "Roll the dice"}
          </button>
        </div>
      </div>
    </div>
  );
}