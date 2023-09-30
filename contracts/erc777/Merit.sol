//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC777/IERC777Sender.sol";
import "@openzeppelin/contracts/token/ERC777/IERC777.sol";
import "@openzeppelin/contracts/utils/introspection/IERC1820Registry.sol";
import "@openzeppelin/contracts/utils/introspection/IERC1820Implementer.sol";

contract SenderControl is IERC777Sender, IERC1820Implementer {
    IERC1820Registry private _erc1820 =
        IERC1820Registry(0x1820a4B7618BdE71Dce8cdc73aAB6C95905faD24);
    bytes32 private constant ERC1820_ACCEPT_MAGIC =
        keccak256(abi.encodePacked("ERC1820_ACCEPT_MAGIC"));

    //    keccak256("ERC777TokensSender")
    bytes32 private constant TOKENS_SENDER_INTERFACE_HASH =
        0x29ddb589b1fb5fc7cf394961c1adf5f8c6454761adf795e67fe149f658abe895;

    mapping(address => bool) blacklist;
    address _owner;

    constructor() {
        _owner = msg.sender;
    }

    //  account call erc1820.setInterfaceImplementer
    function canImplementInterfaceForAddress(
        bytes32 interfaceHash,
        address /* account */
    ) external pure returns (bytes32) {
        if (interfaceHash == TOKENS_SENDER_INTERFACE_HASH) {
            return ERC1820_ACCEPT_MAGIC;
        } else {
            return bytes32(0x00);
        }
    }

    function setBlack(address account, bool b) external {
        require(msg.sender == _owner, "no premission");
        blacklist[account] = b;
    }

    function tokensToSend(
        address /* operator */,
        address /* from */,
        address to,
        uint /* amount */,
        bytes calldata /* userData */,
        bytes calldata /* operatorData */
    ) external view {
        if (blacklist[to]) {
            revert("ohh... on blacklist");
        }
    }
}
