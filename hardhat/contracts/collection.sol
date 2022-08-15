// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract TopCollections is ERC721A, Ownable {
    uint8 public MAX_USER_LIMIT;
    uint256 public TOKEN_PRICE;
    uint256 public MAX_SUPPLY;
    bytes32 public merkleRoot;
    string private baseURI;

    constructor(
        uint256 _TOKEN_PRICE,
        uint8 _MAX_USER_LIMIT,
        uint256 _MAX_SUPPLY
    ) ERC721A("TopCollections", "TOP") {
        TOKEN_PRICE = _TOKEN_PRICE;
        MAX_USER_LIMIT = _MAX_USER_LIMIT;
        MAX_SUPPLY = _MAX_SUPPLY;
    }

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "The caller is another contract");
        _;
    }

    modifier hasWhitelist(bytes32[] calldata proof) {
        bytes32 leaf = keccak256(abi.encode(msg.sender));
        bool whitelited = MerkleProof.verify(proof, merkleRoot, leaf);
        require(whitelited, "This address is not whitelisted");
        _;
    }

    function setMerkleRoot(bytes32 root) external payable {
        merkleRoot = root;
    }

    function numberMinted(address user) external view returns (uint) {
        return _numberMinted(user);
    }

    function mintOne(bytes32[] calldata proof)
        external
        payable
        callerIsUser
        hasWhitelist(proof)
    {
        require(
            _numberMinted(msg.sender) < MAX_USER_LIMIT,
            "Exceded max mint limit"
        );
        require(msg.value >= TOKEN_PRICE, "Not enough ETH sent");
        require(_totalMinted() + 1 <= MAX_SUPPLY, "Reached max supply");
        _mint(msg.sender, 1);
    }

    function withdrawl() external payable onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function setBaseURI(string calldata newBaseURI) external payable onlyOwner {
        baseURI = newBaseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function totalMinted() external view returns (uint) {
        return _totalMinted();
    }
}
