// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error Airdrop__IllLength();
error Airdrop__OverAmount();
error Airdrop__IllAmount();

contract Airdrop {
    function getSum(uint256[] calldata _arr) public pure returns (uint sum) {
        for (uint i = 0; i < _arr.length; i++) sum = sum + _arr[i];
    }

    // 空投 token
    function multiTransferToken(
        address _token,
        address[] calldata _addresses,
        uint256[] calldata _amounts
    ) external {
        if (_addresses.length != _amounts.length) {
            revert Airdrop__IllLength();
        }

        IERC20 token = IERC20(_token);
        uint _amountSum = getSum(_amounts);
        if (token.allowance(msg.sender, address(this)) < _amountSum) {
            revert Airdrop__OverAmount();
        }

        for (uint8 i; i < _addresses.length; i++) {
            token.transferFrom(msg.sender, _addresses[i], _amounts[i]);
        }
    }

    // 批量空投 eth
    function multiTransferETH(
        address payable[] calldata _addresses,
        uint256[] calldata _amounts
    ) public payable {
        if (_addresses.length != _amounts.length) {
            revert Airdrop__IllLength();
        }

        uint _amountSum = getSum(_amounts);
        if (msg.value != _amountSum) {
            revert Airdrop__IllAmount();
        }

        for (uint256 i = 0; i < _addresses.length; i++) {
            _addresses[i].transfer(_amounts[i]);
        }
    }
}
