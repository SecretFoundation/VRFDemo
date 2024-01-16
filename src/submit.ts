import { ethers } from "ethers";
import { BigNumber } from "bignumber.js";

export async function setupSubmit(element: HTMLButtonElement) {

    const randomnessContract = '0x6350913fDbBb5700100078e1d649836d35F212C1'

    // @ts-ignore
    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Create a contract instance
    const randomnessAbi = [{"type":"constructor","inputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"VRFGateway","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"fulfillRandomWords","inputs":[{"name":"requestId","type":"uint256","internalType":"uint256"},{"name":"randomWords","type":"uint256[]","internalType":"uint256[]"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"requestRandomnessTest","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setGatewayAddress","inputs":[{"name":"_VRFGateway","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"fulfilledRandomWords","inputs":[{"name":"requestId","type":"uint256","indexed":false,"internalType":"uint256"},{"name":"randomWords","type":"uint256[]","indexed":false,"internalType":"uint256[]"}],"anonymous":false},{"type":"event","name":"requestRandomness","inputs":[{"name":"requestId","type":"uint256","indexed":false,"internalType":"uint256"}],"anonymous":false}]
    const randomnessContractInterface = new ethers.Contract(randomnessContract, randomnessAbi, provider);

    element.addEventListener("click", async function(event: Event){
        event.preventDefault()
        const [myAddress] = await provider.send("eth_requestAccounts", []);
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xAA36A7' }], // chainId must be in hexadecimal numbers
        });


        // create the abi interface and encode the function data
        const iface= new ethers.utils.Interface( randomnessAbi )
        const FormatTypes = ethers.utils.FormatTypes;
        console.log(iface.format(FormatTypes.full))


        const functionData = iface.encodeFunctionData("requestRandomnessTest")
        console.log(functionData)

        await (window as any).ethereum.request({
            "method": "wallet_switchEthereumChain",
            "params": [
              {
                "chainId": "0xAA36A7"
              }
            ]
          });

        const tx_params = [
            {
                gas: '0x249F0', // 150000
                to: randomnessContract,
                from: myAddress,
                value: '0x00', // 0
                data: functionData, 
            },
          ];

        const txHash = await provider.send("eth_sendTransaction", tx_params);

        // Set up an event listener for the 'logNewTask' event
        randomnessContractInterface.on('requestRandomness', (originalRequestId) => {
            console.log(`Request ID: ${originalRequestId}`);
            randomnessContractInterface.on('fulfilledRandomWords', (requestId, randomWords, event) => {
              console.log(`Callback with Request ID: ${requestId.toString()}`);
          
              if (originalRequestId.toString() == requestId.toString()) {
                  console.log(`Random Words: ${randomWords}`);
          
                  let diceRollsHTML = randomWords.map((word: any) => {
                    let diceRoll = new BigNumber(word.toString());                 
                    let moduloResult = diceRoll.modulo(6).plus(1);

                    return `<div>Dice Roll: ${moduloResult.toString()}</div>`;
                }).join('');
          
                  document.querySelector<HTMLDivElement>('#preview')!.innerHTML = `
                      <h2>Transaction Parameters</h2>
                      <p><b>Request ID: ${requestId} </b></p>
                      <p><b>Dice Rolls:</b></p>
                      ${diceRollsHTML}
                      <p style="font-size: 0.8em;">${JSON.stringify(tx_params)}</p>
                  `
              }
        });
        });

        document.querySelector<HTMLDivElement>('#preview')!.innerHTML = `
        </p>
        <h2>Transaction Parameters</h2>
        <p><b>Tx Hash: </b><a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank">${txHash}</a></p>
        <p><b>Randomness Contract Address </b><a href="https://sepolia.etherscan.io/address/${randomnessContract}" target="_blank">${randomnessContract}</a></p>
        <p style="font-size: 0.8em;">${JSON.stringify(tx_params)}</p>
        `

    })
}