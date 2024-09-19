// submit.ts
import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import { hexlify } from "ethers/lib/utils";

// Define ABI and contract address
const randomnessContract = "0x3C260caf0763eD69dfc6628Ab2480717b4B72d0a";
// Create a contract instance
const randomnessAbi = [
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "requestId",
          type: "uint256",
        },
        {
          indexed: false,
          internalType: "uint256[]",
          name: "randomWords",
          type: "uint256[]",
        },
      ],
      name: "fulfilledRandomWords",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "requestId",
          type: "uint256",
        },
      ],
      name: "requestedRandomness",
      type: "event",
    },
    {
      inputs: [],
      name: "VRFGateway",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "requestId", type: "uint256" },
        { internalType: "uint256[]", name: "randomWords", type: "uint256[]" },
      ],
      name: "fulfillRandomWords",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "owner",
      outputs: [{ internalType: "address", name: "", type: "address" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint32", name: "_numWords", type: "uint32" },
        { internalType: "uint32", name: "_callbackGasLimit", type: "uint32" },
      ],
      name: "requestRandomnessTest",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint32", name: "_numWords", type: "uint32" },
        { internalType: "uint32", name: "_callbackGasLimit", type: "uint32" },
      ],
      name: "requestRandomnessTest2",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [],
      name: "requestRandomnessTestPreset",
      outputs: [],
      stateMutability: "payable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "_VRFGateway", type: "address" },
      ],
      name: "setGatewayAddress",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

export const setupSubmit = async () => {
  try {
    // Ensure the user is connected to the right chain
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xAA36A7" }],
    });

    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    const [myAddress] = await provider.send("eth_requestAccounts", []);

    const iface = new ethers.utils.Interface(randomnessAbi);
    const numWords = 20;
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
