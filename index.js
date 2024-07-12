import { ethers } from "./ethers-5.1.esm.min.js";
import { contractAddress, abi } from "./constants.js";

console.log("The ethers object is:");
console.log(ethers);

if (document.readyState !== "loading") {
	init();
} else {
	document.addEventListener("DOMContentLoaded", init);
}

function init() {
	const buttonConnect = document.getElementById("button-connect");
	const buttonFund = document.getElementById("button-fund");
	const buttonBalance = document.getElementById("button-balance");
	const buttonWithdraw = document.getElementById("button-withdraw");

	if (!window.ethereum) {
		console.error("Metamask does NOT exist");
		buttonConnect.textContent = "Can't find Metamask";
		buttonConnect.disabled = true;
		buttonFund.disabled = true;
		buttonBalance.disabled = true;
		return;
	}
	console.log("Metamask does exist !");
	connectToWallet();
	getBalance();

	buttonConnect.addEventListener("click", connectToWallet);
	buttonFund.addEventListener("click", fundContract);
	buttonBalance.addEventListener("click", getBalance);
	buttonWithdraw.addEventListener("click", withdraw);

	// Function used for listening for the Blockchain.
	function listenForTransactionMine(transactionResponse, provider) {
		console.log(`Mining ${transactionResponse.hash}...`);
		// Create a listener for the blockchain.
		return new Promise((resolve, reject) => {
			// Listen for this transaction to finish.
			provider.once(transactionResponse.hash, (transactionReceipt) => {
				// Only one time.
				console.log(
					`Completed with ${transactionReceipt.confirmations} confirmations`,
				);
			});
			resolve();
		});
	}

	// Function used to connect to the user's wallet.
	async function connectToWallet() {
		const connectionResult = await window.ethereum.request({
			method: "eth_requestAccounts",
		});
		console.log(connectionResult);
		const mainAddress = connectionResult[0]; // The main address of the wallet connected.
		console.log(mainAddress);

		buttonConnect.textContent = "Connected";
	}

	// Function used to fund the Contract "FundMe".
	async function fundContract() {
		const inputAmount = document.getElementById("input-amount");
		if (!inputAmount || inputAmount.value < 0.01) {
			console.error("Error with amount sent to fund the Contract");
			return;
		}

		const ethAmount = inputAmount.value;
		console.log(`Funding with ${ethAmount}`);

		// Provider/connection to the blockchain.
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		console.log("The provider is:");
		console.log(provider);

		// Signer/wallet/someone with gas.
		const signer = provider.getSigner();
		console.log("The signer is:");
		console.log(signer);

		// Contract that we are interacting with -> ABI and address.
		const contract = new ethers.Contract(contractAddress, abi, signer);
		console.log("The contract is:");
		console.log(contract);

		try {
			const transactionResponse = await contract.fund({
				value: ethers.utils.parseEther(ethAmount),
			});
			console.log("The transaction response is:");
			console.log(transactionResponse);

			// Listen the transaction to be mined.
			await listenForTransactionMine(transactionResponse, provider);

			getBalance(); // Update the current balance.
			console.log("Fund done!");
		} catch (error) {
			console.error(error);
		}
	}

	// Function used to obtain the value of the current balance of the Contract.
	async function getBalance() {
		// Provider/connection to the blockchain.
		const provider = new ethers.providers.Web3Provider(window.ethereum);

		const balance = await provider.getBalance(contractAddress);
		const balanceFormatted = ethers.utils.formatEther(balance);
		console.log(`The current balance is: ${balanceFormatted}`);

		const textBalance = document.getElementById("balance");
		textBalance.textContent = balanceFormatted;
	}

	// Function used to withdraw all the fund from the Contract.
	async function withdraw() {
		console.log("Withdrawing fund...");

		// Provider/connection to the blockchain.
		const provider = new ethers.providers.Web3Provider(window.ethereum);
		const signer = provider.getSigner();
		const contract = new ethers.Contract(contractAddress, abi, signer);

		try {
			const transactionResponse = await contract.withdraw();
			console.log("The transaction response is:");
			console.log(transactionResponse);

			// Listen the transaction to be mined.
			await listenForTransactionMine(transactionResponse, provider);

			getBalance(); // Update the current balance.
			console.log("Withdraw done!");
		} catch (error) {
			console.error(error);
		}
	}
}
