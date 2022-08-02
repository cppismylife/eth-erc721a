import { NextApiRequest, NextApiResponse } from "next";
import keccak256 from "keccak256";
import { ethers } from "ethers";
import { setMerkleTree, encodeLeaf } from "../../utils/setupTree";

const merkleTree = setMerkleTree();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const address = req.query.address as string;
  const signature = req.query.signature as string;
  const signer = ethers.utils.verifyMessage(
    "Sign to verify your address",
    signature
  );
  if (signer.toLowerCase() == address) {
    const leaf = keccak256(encodeLeaf(address));
    const proof = merkleTree.getHexProof(leaf);
    if (!proof.length) {
      res.status(500).send("You are not whitelisted!");
    } else res.send(proof);
  } else res.status(500).send("Failed to verify");
}
