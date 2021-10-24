import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';
import myEpicNft from './utils/MyEpicNFT.json';

// Constants
const TWITTER_HANDLE = 'camaragoon';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const OPENSEA_LINK = 'https://testnets.opensea.io/assets';
const TOTAL_MINT_COUNT = 50;

const CONTRACT_ADDRESS = "0xe293010D86817550e47556954A5285c91A10AE50";

const App = () => {
  // Render Methods
  const [currentAccount, setCurrentAccount] = useState("");
  const [totalMintedNFTs, setTotalMintedNFTs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isNFTMinted, setIsNFTMinted] = useState(false);
  const [currentOpenSeaLink, setCurrentOpenSeaLink] = useState("");

  useEffect(() => {
    checkIfWalletIsConnected();
    getNFTData();
  }, []);

  const getNFTData = async () => {
    const { ethereum } = window;
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);
    let countMintedNFTs = await connectedContract.getTotalNFTsMintedSoFar();
    setTotalMintedNFTs(countMintedNFTs.toNumber());
    console.log("%d NFTs minted so far.", countMintedNFTs.toNumber() - 1);
  }

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    !ethereum ? console.log("Make sure you have metamask!") : console.log("We have the ethereum object", ethereum);

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      !ethereum ?? alert("Get MetaMask!");

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
      setupEventListener();
    } catch (error) {
      console.error(error)
    }
  }

  const checkIfWalletIsOnRinkeby = async () => {
    const { ethereum } = window;
    let chainId = await ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain " + chainId);

    const rinkebyChainId = "0x4";
    chainId !== rinkebyChainId ?? alert("You are not connected to the Rinkeby Test Network!");
  }

  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        checkIfWalletIsOnRinkeby();
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber());
          setLoading(false);
          setIsNFTMinted(true);
          setCurrentOpenSeaLink(`${OPENSEA_LINK}/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
          // alert(`Hey there! We've minted your NFT and sent it to your wallet. It may be blank right now. It can take a max of 10 min to show up on OpenSea. Here's the link: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)
        });

        console.log("Setup event listener!");
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, myEpicNft.abi, signer);

        setIsNFTMinted(false);
        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();
        setLoading(true)
        console.log("Mining...please wait.")
        await nftTxn.wait();
        console.log(nftTxn);
        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);
        

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  const renderOpenSeaLink = () => {
    window.open(currentOpenSeaLink)
  }

  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const renderMintUI = () => (
    <button onClick={askContractToMintNft} className="cta-button connect-wallet-button">
      Mint NFT
    </button>
  )

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">Square NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          <p className="mint-count">{`${totalMintedNFTs - 1} OUT OF ${TOTAL_MINT_COUNT} MINTED`}</p>
          {currentAccount === "" ? renderNotConnectedContainer() : renderMintUI()}
          {isNFTMinted && <button className="cta-button opensea-button" onClick={renderOpenSeaLink}>Check out on OpenSea</button>}
        </div>
        {loading && <div className="loading-container">
          <span className="loading-text">MINING... PLEASE WAIT</span>
          {/* <p className="loading-text">MINING... PLEASE WAIT</p> */}
          <div className="loading-animation"></div>
        </div>}
        {isNFTMinted && <span className="completed-text">NFT MINTED!</span>}
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
