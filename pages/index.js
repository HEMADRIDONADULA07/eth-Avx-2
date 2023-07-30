import { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [inputAmount, setInputAmount] = useState("");
  const [lastTransactionId, setLastTransactionId] = useState("");

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        handleAccount(accounts[0]); // Use the first account if available
      } else {
        setAccount(undefined);
      }
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account);
    } else {
      console.log("No account found");
      setAccount(undefined);
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({ method: "eth_requestAccounts" });
    if (accounts.length > 0) {
      handleAccount(accounts[0]); // Use the first account if available
    }
    // else: No accounts available, account state will be set to undefined

    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(contractAddress, atmABI, signer);

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm && account) {
      setBalance((await atm.getBalance()).toNumber());
    }
  };

  const handleInputAmountChange = (event) => {
    setInputAmount(event.target.value);
  };

  const deposit = async () => {
    if (!inputAmount || isNaN(inputAmount)) {
      alert("Please enter a valid amount.");
      return;
    }

    const amount = ethers.utils.parseEther(inputAmount);

    if (atm) {
      try {
        let tx = await atm.deposit(amount);
        await tx.wait();
        getBalance();
        setInputAmount("");
        setLastTransactionId(tx.hash); // Store the transaction hash in state
      } catch (error) {
        console.error("Error occurred during deposit:", error);
      }
    }
  };

  const withdraw = async () => {
    if (!inputAmount || isNaN(inputAmount)) {
      alert("Please enter a valid amount.");
      return;
    }

    const amount = ethers.utils.parseEther(inputAmount);

    if (atm) {
      try {
        let tx = await atm.withdraw(amount);
        await tx.wait();
        getBalance();
        setInputAmount("");
        setLastTransactionId(tx.hash); // Store the transaction hash in state
      } catch (error) {
        console.error("Error occurred during withdrawal:", error);
      }
    }
  };

  const initUser = () => {
    if (!ethWallet) {
      return <p>Please install MetaMask in order to use this ATM.</p>;
    }

    if (!account) {
      return (
        <button onClick={connectAccount}>
          Please connect your MetaMask wallet
        </button>
      );
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div>
        <input
          type="text"
          value={inputAmount}
          onChange={handleInputAmountChange}
          placeholder="Enter amount"
        />
        <button onClick={deposit}>Deposit ETH</button>
        <button onClick={withdraw}>Withdraw ETH</button>
        {account && <p>Your Account: {account}</p>}
        {lastTransactionId && (
          <p>Last Transaction ID: {lastTransactionId}</p>
        )}
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Welcome to the Hemadris ATM!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
        }
      `}</style>
    </main>
  );
}