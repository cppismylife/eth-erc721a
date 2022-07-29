const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const hre = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("Mint", () => {
  const tokenPrice = hre.ethers.utils.parseUnits("0.1");

  const deployFixture = async () => {
    const [_, sig1, sig2] = await hre.ethers.getSigners();
    const leaves = [encodeLeaf(sig1.address), encodeLeaf(sig2.address)];
    const merkleTree = new MerkleTree(leaves, keccak256, {
      sortPairs: true,
      hashLeaves: true,
    });
    const contractFactory = await hre.ethers.getContractFactory(
      "TopCollections"
    );
    const contract = await contractFactory.deploy(tokenPrice, 1, 10000);
    await contract.deployed();
    await contract.setMerkleRoot(merkleTree.getHexRoot());
    return { contract, merkleTree };
  };

  const encodeLeaf = (address) => {
    return hre.ethers.utils.defaultAbiCoder.encode(["address"], [address]);
  };

  it("Should mint to whitelisted address", async () => {
    const { contract, merkleTree } = await loadFixture(deployFixture);
    const [_, sig1, sig2] = await hre.ethers.getSigners();

    // Try sig1
    const proof1 = merkleTree.getHexProof(keccak256(encodeLeaf(sig1.address)));
    await contract.connect(sig1).mintOne(proof1, { value: tokenPrice });
    // Try sig2
    const proof2 = merkleTree.getHexProof(keccak256(encodeLeaf(sig2.address)));
    await contract.connect(sig2).mintOne(proof2, { value: tokenPrice });

    const totalMinted = await contract.totalSupply();
    expect(totalMinted).eq(2);
  });

  it("Should not mint to non-whitelisted address", async () => {
    const { contract, merkleTree } = await loadFixture(deployFixture);
    const [owner] = await hre.ethers.getSigners();
    const proof = merkleTree.getHexProof(keccak256(encodeLeaf(owner.address)));
    await expect(contract.mintOne(proof, { value: tokenPrice })).to.be.reverted;
  });

  it("Should not mint if user limit is exceeded", async () => {
    const { contract, merkleTree } = await loadFixture(deployFixture);
    const [_, signer] = await hre.ethers.getSigners();
    const proof = merkleTree.getHexProof(keccak256(encodeLeaf(signer.address)));
    await contract.connect(signer).mintOne(proof, { value: tokenPrice });
    expect(await contract.totalSupply()).eq(1);
    await expect(contract.connect(signer).mintOne(proof, { value: tokenPrice }))
      .to.be.reverted;
  });
});
