// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Faucet {
    // 每次领 100 单位代币
    uint256 public amountAllowed = 100;
    // token合约地址
    address public tokenContract;
    // 记录领取过代币的地址
    mapping(address => bool) public requestedAddress;

    event SendToken(address indexed Receiver, uint256 indexed Amount);

    constructor(address _tokenContract) {
        tokenContract = _tokenContract; // set token contract
    }

    function requestTokens() external {
        IERC20 token = IERC20(tokenContract);

        // 领过了
        require(
            requestedAddress[msg.sender] == false,
            "Can't Request Multiple Times!"
        );
        // 水龙头空了
        require(
            token.balanceOf(address(this)) >= amountAllowed,
            "Faucet Empty!"
        );

        token.transfer(msg.sender, amountAllowed);

        requestedAddress[msg.sender] = true;
        emit SendToken(msg.sender, amountAllowed);
    }
}
