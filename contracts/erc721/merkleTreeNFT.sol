// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

error MerkleTreeNFT__InvalidProof();
error MerkleTreeNFT__AlreadyMinted();

contract MerkleTreeNFT is ERC721 {
    bytes32 public immutable root;
    // 记录已经mint的地址
    mapping(address => bool) public mintedAddress;

    constructor(
        string memory name,
        string memory symbol,
        bytes32 merkleroot
    ) ERC721(name, symbol) {
        root = merkleroot;
    }

    function mint(
        address account,
        uint256 tokenId,
        bytes32[] calldata proof
    ) external {
        bytes32 leaf = keccak256(abi.encodePacked(account));
        if (!verify(proof, leaf)) {
            revert MerkleTreeNFT__InvalidProof();
        }

        if (mintedAddress[account]) {
            revert MerkleTreeNFT__AlreadyMinted();
        }

        mintedAddress[account] = true;
        _mint(account, tokenId);
    }

    function verify(
        bytes32[] memory proof,
        bytes32 leaf
    ) public view returns (bool) {
        return processProof(proof, leaf) == root;
    }

    function processProof(
        bytes32[] memory proof,
        bytes32 leaf
    ) internal pure returns (bytes32) {
        bytes32 computedHash = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            computedHash = _hashPair(computedHash, proof[i]);
        }
        return computedHash;
    }

    function _hashPair(bytes32 a, bytes32 b) private pure returns (bytes32) {
        return
            a < b
                ? keccak256(abi.encodePacked(a, b))
                : keccak256(abi.encodePacked(b, a));
    }
}
