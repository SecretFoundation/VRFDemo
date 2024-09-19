'use client'
import { initializeWeb3Modal } from "./config/web3ModalConfig"; // Import the function
import { useFetchChainId } from "./utils/fetchChainId"; // Import the hook
import { ethers } from "ethers"

// Initialize Web3Modal
initializeWeb3Modal();

export default function Home() {

const chainId = useFetchChainId(); // Fetch the chainId
 
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
        <p className="mt-4 text-md text-gray-500">
          This demo generates 20 (can be up to 2000) verifiable random numbers in just one transaction.
        </p>
      </div>

      {/* Roll the dice button */}
      <div className="mt-8">
        <button className="px-6 py-3 rounded-full border border-gray-300 hover:border-blue-500 text-gray-700 transition">
          Roll the dice
        </button>
      </div>
    </div>
  )
}
