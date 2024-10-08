import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";
import { hexlify } from "ethers/lib/utils";

export async function setupSubmit(element: HTMLButtonElement) {
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

  element.addEventListener("click", async function (event: Event) {
    event.preventDefault();
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xAA36A7" }],
    });
    // @ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const [myAddress] = await provider.send("eth_requestAccounts", []);

    // create the abi interface and encode the function data
    const iface = new ethers.utils.Interface(randomnessAbi);

    // Can be up to 2000 random numbers, change this according to your needs
    const numWords = 20;

    // Change callbackGasLimit according to your needs for post processing in your callback, if you have more numWords, then this number has to be increased.
    const callbackGasLimit = 90000;

    //Then calculate how much gas you have to pay for the callback
    //Forumla: callbackGasLimit*tx.gasfee, use an appropriate overhead for the transaction, 1,5x = 3/2 is recommended since gasPrice fluctuates.
    //For this we try to gather the old pre and post EIP-1559 gas costs from the RPCs (to support both in parallel)

    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas;
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
    const gasFee = (maxFeePerGas && maxPriorityFeePerGas) ? maxFeePerGas.add(maxPriorityFeePerGas) : await provider.getGasPrice()

    const amountOfGas = gasFee.mul(callbackGasLimit).mul(3).div(2);

    const functionData = iface.encodeFunctionData("requestRandomnessTest", [
      numWords,
      callbackGasLimit,
    ]);

    const tx_params = [
      {
        gas: "0x249F0", // 150000
        to: randomnessContract,
        from: myAddress,
        value: hexlify(amountOfGas),
        data: functionData,
      },
    ];

    const txHash = await provider.send("eth_sendTransaction", tx_params);
    stopLoadingAnimation();
    startLoadingAnimation();
    let timeoutId: any;
      // Your custom RPC URL (for example, from Infura or Alchemy)
    const customRpcUrl = "https://sepolia.gateway.tenderly.co";

    // Create a provider using the custom URL
    const EventProvider = new ethers.providers.JsonRpcProvider(customRpcUrl);
    const EventRandomnessContractInterface = new ethers.Contract(
      randomnessContract,
      randomnessAbi,
      EventProvider
    );
    let extraText = "";

    try {
    // Set up an event listener for the 'logNewTask' event
    EventRandomnessContractInterface.on(
      "requestedRandomness",
      (originalRequestId, event) => {
        const eventTxHash = event.transactionHash;

        // Check if the transaction hash matches
        if (eventTxHash === txHash) {
          extraText = `Request ID: ${originalRequestId}`;
          console.log(`Request ID: ${originalRequestId}`);

          // Set a timeout for 90 seconds

          timeoutId = setTimeout(() => {
            console.error("Timeout: No response received within 90 seconds.");
            document.querySelector<HTMLDivElement>("#preview")!.innerHTML = `
              <h3>Transaction might take a bit longer than expected due to network congestion or the event was not picked up correctly.</h3> 
              <p>You can check the event here:<a href="https://sepolia.etherscan.io/address/${randomnessContract}#events" target="_blank">Events of ${randomnessContract}</a></p>
              <h2>Transaction Parameters</h2> 
              </p>
              <p><b>Tx Hash: </b><a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank">${txHash}</a></p>
              <p><b>Randomness Contract Address </b><a href="https://sepolia.etherscan.io/address/${randomnessContract}" target="_blank">${randomnessContract}</a></p>
              <p style="font-size: 0.8em;">${JSON.stringify(tx_params)}</p>`;
            stopLoadingAnimation();
          }, 90000); // 90 seconds

          EventRandomnessContractInterface.on(
            "fulfilledRandomWords",
            (requestId, randomWords, event) => {
              console.log(`Callback with Request ID: ${requestId.toString()}`);
              clearTimeout(timeoutId);
              stopLoadingAnimation();

              if (originalRequestId.toString() == requestId.toString()) {
                console.log(`Random Words: ${randomWords}`);
                let diceRollsHTML =
                  `<div style="display: flex; flex-wrap: wrap; gap: 20px;">` +
                  randomWords
                    .map((word: any, i: number) => {
                      let diceRoll = new BigNumber(word.toString());
                      let moduloResult = diceRoll.modulo(6).plus(1);
                      return `<div style="display: flex; align-items: center; gap: 10px;">
                                                  <span>${(
                                                    i + 1
                                                  ).toString()}. Dice Roll:</span>
                                                  <img src='${moduloResult.toString()}.svg' alt='Dice Result: ${moduloResult.toString()}' width="50" height="50" />
                                              </div>`;
                    })
                    .join("") +
                  `</div>`;

                document.querySelector<HTMLDivElement>(
                  "#preview"
                )!.innerHTML = `
                    <p><b>Request ID: ${requestId} </b></p>
                    <p><b>Dice Rolls:</b></p>
                    ${diceRollsHTML}
                    <p>You can check the callback here:
                    <a href="https://sepolia.etherscan.io/tx/${event.transactionHash}" target="_blank">Callback TX: ${event.transactionHash}</a></p>
                    <h2>Transaction Parameters</h2> 
                    </p>
                    <p><b>Tx Hash: </b><a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank">${txHash}</a></p>
                    <p><b>Randomness Contract Address </b><a href="https://sepolia.etherscan.io/address/${randomnessContract}" target="_blank">${randomnessContract}</a></p>
                    <p style="font-size: 0.8em;">${JSON.stringify(
                      tx_params
                    )}</p>
                `;
              }
            }
          );
        }
      }
    );}
    catch (error) {
      console.error("Failed to subscribe to events, retrying...", error);
    }

    function startLoadingAnimation() {
      let dotCount = 0;
      (window as any).loadingInterval = setInterval(() => {
        dotCount = (dotCount + 1) % 5;
        const loadingText =
          "Waiting callback with VRF result" + ".".repeat(dotCount);
        document.querySelector<HTMLDivElement>("#preview")!.innerHTML = `
              <h3>${loadingText}</h3> 
              ${extraText && `<p><b>${extraText}</b></p>`}
              <h2>Transaction Parameters</h2> 
              </p>
              <p><b>Tx Hash: </b><a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank">${txHash}</a></p>
              <p><b>Randomness Contract Address </b><a href="https://sepolia.etherscan.io/address/${randomnessContract}" target="_blank">${randomnessContract}</a></p>
              <p style="font-size: 0.8em;">${JSON.stringify(tx_params)}</p>`;
      }, 500); // Adjust the speed of dot animation if needed
    }

    function stopLoadingAnimation() {
      clearInterval((window as any).loadingInterval);
    }
  });
}
