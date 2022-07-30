const hre = require("hardhat");

const deploy = async () => {
  const factory = await hre.ethers.getContractFactory("TopCollections");
  const contract = await factory.deploy(
    hre.ethers.utils.parseUnits("0.01"),
    1,
    9
  );
  await contract.deployed();
  console.log(
    "Add this to NEXt_PUBLIC_NFT_CONTRACT in root .env: " + contract.address
  );
};

deploy();
