//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC777/ERC777.sol";

contract GLDToken is ERC777 {
    constructor(
        address[] memory defaultOperators
    ) ERC777("Gold", "GLD", defaultOperators) {
        uint initialSupply = 2100 * 10 ** 18;
        _mint(msg.sender, initialSupply, "", "");
    }
}
