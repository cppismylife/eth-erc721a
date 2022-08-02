import Head from "next/head";
import { useEffect, useState, Dispatch, SetStateAction } from "react";
import { ethers } from "ethers";
import abi from "../abi.json";

const getProvider = () => {
  const { ethereum } = window;
  if (ethereum) return ethereum;
  else {
    alert("Install metamask!");
    throw new Error("Metamask is not installed");
  }
};

const getContract = async () => {
  const provider = new ethers.providers.Web3Provider(getProvider());
  const contract = new ethers.Contract(
    process.env.NEXT_PUBLIC_NFT_CONTRACT as string,
    abi.abi,
    provider
  );
  return contract;
};

export default function IndexPage() {
  const [address, setAddress] = useState("");
  const [hasMinted, setMintStatus] = useState(false);
  const [mintInfo, updateMintInfo] = useState({
    mintedCount: 0,
    maxSupply: 0,
  });

  useEffect(() => {
    (async () => {
      const provider = getProvider();
      const accounts = await provider.request({ method: "eth_accounts" });
      const contract = await getContract();
      updateMintedAmount(contract);
      if (accounts.length) {
        setAddress(accounts[0]);
        await hasUserMinted(contract, accounts[0]);
      }
    })();
  }, []);

  const hasUserMinted = async (contract: ethers.Contract, account: string) => {
    const mintedAmount = await contract.numberMinted(account);
    setMintStatus(Boolean(mintedAmount.toNumber()));
  };

  const updateMintedAmount = async (contract: ethers.Contract) => {
    const maxSupply = (await contract.MAX_SUPPLY()).toNumber();
    const mintedCount = (await contract.totalMinted()).toNumber();
    updateMintInfo({ mintedCount, maxSupply });
  };

  return (
    <>
      <Head>
        <title>Top Collections</title>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="min-h-screen bg-[#1b1d21] text-white">
        <header>
          <div className="flex text-center items-center pt-10 relative justify-between">
            <h1 className=" ml-5 text-4xl font-bold tracking-wide">
              All top NFTs just in one collection
            </h1>
            <Wallet address={address} setAddress={setAddress} />
          </div>
        </header>
        <main>
          <div className="text-center mt-10 max-w-screen-lg mx-auto">
            <h2 className="text-3xl mb-10">
              Mint one token from the top nft collections like CryptoPunks,
              BAYC, Azuki and more!{" "}
              <span className="italic text-rose-300">
                You need to have your address whitelisted to be able to mint
              </span>
            </h2>
            <div className="flex justify-evenly">
              <img
                src="./punk.png"
                className="lg:w-72 rounded-xl w-56"
                alt="Crypto Punk"
              />
              <img src="./bayc.png" className="lg:w-72 w-56" alt="BAYC" />
              <img src="./mayc.png" className="lg:w-72 w-56" alt="MAYC" />
            </div>
            <div className="mt-10">
              <p className="text-2xl mb-3">
                Available: {mintInfo.maxSupply - mintInfo.mintedCount}/
                {mintInfo.maxSupply}
              </p>
              {address ? (
                <>
                  {!hasMinted ? (
                    <MintButton
                      address={address}
                      updateMintedAmount={updateMintedAmount}
                    />
                  ) : (
                    <p className="text-xl">You have already minted</p>
                  )}
                </>
              ) : (
                <p className="text-xl">First you need to connect wallet</p>
              )}
            </div>
          </div>
        </main>
        <footer></footer>
      </div>
    </>
  );
}

const MintButton = (props: {
  address: string;
  updateMintedAmount: Function;
}) => {
  const address = props.address;
  const [error, onError] = useState({ isError: false, errorMsg: "" });
  const [isMinting, setIsMinting] = useState(false);
  const [txURL, setTxURL] = useState("");

  const mint = async () => {
    const provider = new ethers.providers.Web3Provider(getProvider());
    const signer = provider.getSigner();
    const signature = await signer.signMessage("Sign to verify your address");
    const response = await fetch(
      `./api/proof?address=${address}&signature=${signature}`
    );
    if (!response.ok) {
      onError({ isError: true, errorMsg: await response.text() });
      return;
    }
    const proof = await response.json();
    const contract = await getContract();
    const price = (await contract.TOKEN_PRICE()).toString();
    const tx = await contract
      .connect(provider.getSigner())
      .mintOne(proof, { value: price });
    setIsMinting(true);
    const receipt = await tx.wait();
    console.log(receipt.transactionHash);
    setTxURL(`https://goerli.etherscan.io/tx/${receipt.transactionHash}`);
    setIsMinting(false);
    props.updateMintedAmount(contract);
  };

  if (error.isError)
    return <h3 className="text-rose-600 text-2xl">{error.errorMsg}</h3>;
  else if (txURL)
    return (
      <h3 className="text-xl font-semibold">
        Successfully minted!{" "}
        <a className=" underline " href={txURL}>
          Click to see your nft
        </a>
      </h3>
    );
  else
    return (
      <>
        {isMinting ? (
          <p className="text-lg">Transcation is processing...</p>
        ) : (
          <button
            className="rounded font-bold w-24 bg-white text-black p-3 duration-700 hover:bg-gray-300"
            onClick={mint}
          >
            Mint
          </button>
        )}
      </>
    );
};

const Wallet = (props: {
  address: string;
  setAddress: Dispatch<SetStateAction<string>>;
}) => {
  const { address, setAddress } = props;

  const connectWallet = async () => {
    const provider = getProvider();
    const accounts = await provider?.request({ method: "eth_requestAccounts" });
    if (accounts.length) setAddress(accounts[0]);
  };

  return (
    <>
      {address ? (
        <p className="rounded bg-white text-black p-3 mr-4 border">
          {address.slice(0, 5) +
            "..." +
            address.slice(address.length - 3, address.length)}
        </p>
      ) : (
        <button
          onClick={connectWallet}
          className="rounded hover:bg-white hover:text-black p-3 mr-4 text-white border-white border duration-700"
        >
          Connect wallet
        </button>
      )}
    </>
  );
};
