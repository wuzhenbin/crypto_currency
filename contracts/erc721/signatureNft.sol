// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// import "hardhat/console.sol";

library ECDSA {
    function verify(
        bytes32 _msgHash,
        bytes memory _signature,
        address _signer
    ) internal pure returns (bool) {
        return recoverSigner(_msgHash, _signature) == _signer;
    }

    function recoverSigner(
        bytes32 _msgHash,
        bytes memory _signature
    ) internal pure returns (address) {
        require(_signature.length == 65, "invalid signature length");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(_signature, 0x20))
            s := mload(add(_signature, 0x40))
            v := byte(0, mload(add(_signature, 0x60)))
        }
        return ecrecover(_msgHash, v, r, s);
    }

    function toEthSignedMessageHash(
        bytes32 hash
    ) public pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hash)
            );
    }
}
error SignatureNFT__InvalidSignature();
error SignatureNFT__AlreadyMinted();

contract SignatureNFT is ERC721 {
    address public immutable signer;
    mapping(address => bool) public mintedAddress;

    constructor(
        string memory _name,
        string memory _symbol,
        address _signer
    ) ERC721(_name, _symbol) {
        signer = _signer;
    }

    function mint(
        address _account,
        uint256 _tokenId,
        bytes memory _signature
    ) external {
        if (!verify(_account, _tokenId, _signature)) {
            revert SignatureNFT__InvalidSignature();
        }
        if (mintedAddress[_account]) {
            revert SignatureNFT__AlreadyMinted();
        }

        mintedAddress[_account] = true;
        _mint(_account, _tokenId);
    }

    function getMessageHash(
        address _account,
        uint256 _tokenId
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(_account, _tokenId));
    }

    function verify(
        address _account,
        uint256 _tokenId,
        bytes memory _signature
    ) public view returns (bool) {
        bytes32 _msgHash = getMessageHash(_account, _tokenId);
        bytes32 _ethSignedMessageHash = ECDSA.toEthSignedMessageHash(_msgHash);
        return ECDSA.verify(_ethSignedMessageHash, _signature, signer);
    }
}
