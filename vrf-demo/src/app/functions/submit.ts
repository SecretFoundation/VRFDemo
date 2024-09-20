// submit.ts
import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import { hexlify } from "ethers/lib/utils";
import {abi} from "../config/abi";

// Define ABI and contract address
const randomnessContract = "0x3C260caf0763eD69dfc6628Ab2480717b4B72d0a";
// Create a contract instance
const randomnessAbi = abi; 

export const setupSubmit = async () => {
  try {
  
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const [myAddress] = await provider.send("eth_requestAccounts", []);

    const iface = new ethers.utils.Interface(randomnessAbi);
    const numWords = 6;
    const callbackGasLimit = 90000;

    const feeData = await provider.getFeeData();
    const gasFee = feeData.maxFeePerGas && feeData.maxPriorityFeePerGas
      ? feeData.maxFeePerGas.add(feeData.maxPriorityFeePerGas)
      : await provider.getGasPrice();

    const amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);
    const functionData = iface.encodeFunctionData("requestRandomnessTest", [numWords, callbackGasLimit]);

    const tx_params = [
      {
        gas: "0x249F0",
        to: randomnessContract,
        from: myAddress,
        value: hexlify(amountOfGas),
        data: functionData,
      },
    ];

    const txHash = await provider.send("eth_sendTransaction", tx_params);

    // Return the transaction hash for further UI updates
    return {
      txHash,
      numWords,
      randomnessContract,
      tx_params,
    };
  } catch (error) {
    console.error("Transaction failed", error);
    throw error;
  }
};

export const subscribeToEvents = async (
  txHash: string,
  randomnessContract: string,
  setRandomWords: (words: string[]) => void,
  setLoading: (loading: boolean) => void
) => {
  try {
    const customRpcUrl = "https://sepolia.gateway.tenderly.co";
    const EventProvider = new ethers.providers.JsonRpcProvider(customRpcUrl);
    const EventRandomnessContractInterface = new ethers.Contract(randomnessContract, randomnessAbi, EventProvider);

    EventRandomnessContractInterface.on("fulfilledRandomWords", (requestId: any, randomWords: any) => {
      console.log(`Callback with Request ID: ${requestId}`);
      setLoading(false);

      // Update state with the random words
      setRandomWords(randomWords);
    });
  } catch (error) {
    console.error("Failed to subscribe to events", error);
  }
};
