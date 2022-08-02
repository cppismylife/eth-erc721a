import { MerkleTree } from "merkletreejs";
import { ethers } from "ethers";
import Whitelist from "../whitelist.json";
import keccak256 from "keccak256";

export const setMerkleTree = () => {
  return new MerkleTree(
    Whitelist.map((address) => encodeLeaf(address)),
    keccak256,
    {
      sortPairs: true,
      hashLeaves: true,
    }
  );
};
export const encodeLeaf = (address: string) => {
  return ethers.utils.defaultAbiCoder.encode(["address"], [address]);
};
