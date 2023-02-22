// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "hardhat/console.sol";

error EnglishAuction__NotStarted();
error EnglishAuction__Started();
error EnglishAuction__NotOwner();
error EnglishAuction__Ended();
error EnglishAuction__NotHighest();
error EnglishAuction__NotEnded();

contract EnglishAuction {
    event Start();
    event Bid(address indexed sender, uint amount);
    event Withdraw(address indexed bidder, uint amount);
    event End(address winner, uint amount);

    IERC721 public immutable nft;
    uint public immutable nftId;

    // 卖家
    address payable public immutable seller;
    // 拍卖结束时间
    uint public endAt;
    // 拍卖是否开始
    bool public started;
    // 拍卖是否结束
    bool public ended;

    // 最高价账户
    address public highestBidder;
    // 最高价
    uint public highestBid;
    // 记录出价者 用于非出价最高者退款提现
    mapping(address => uint) public bids;

    constructor(address _nft, uint _nftId, uint _startingBid) {
        nft = IERC721(_nft);
        nftId = _nftId;

        seller = payable(msg.sender);
        highestBid = _startingBid;
    }

    function start() external {
        if (started) {
            revert EnglishAuction__Started();
        }

        if (msg.sender != seller) {
            revert EnglishAuction__NotOwner();
        }

        // nft从卖家转到此合约
        nft.transferFrom(msg.sender, address(this), nftId);
        started = true;
        endAt = block.timestamp + 7 days;

        emit Start();
    }

    function bid() external payable {
        if (!started) {
            revert EnglishAuction__NotStarted();
        }

        if (block.timestamp >= endAt) {
            revert EnglishAuction__Ended();
        }

        if (msg.value <= highestBid) {
            revert EnglishAuction__NotHighest();
        }

        // 曾经最高价的账户金额变成待提现
        if (highestBidder != address(0)) {
            bids[highestBidder] += highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        emit Bid(msg.sender, msg.value);
    }

    function withdraw() external {
        uint bal = bids[msg.sender];
        bids[msg.sender] = 0;
        payable(msg.sender).transfer(bal);

        emit Withdraw(msg.sender, bal);
    }

    function end() external {
        if (!started) {
            revert EnglishAuction__NotStarted();
        }

        if (block.timestamp < endAt) {
            revert EnglishAuction__NotEnded();
        }

        if (ended) {
            revert EnglishAuction__Ended();
        }

        ended = true;

        if (highestBidder != address(0)) {
            // nft从此合约转到买家
            nft.safeTransferFrom(address(this), highestBidder, nftId);
            // 卖家从此合约获取nft卖出的资金
            seller.transfer(highestBid);
        } else {
            // 没有买家 nft从此合约转回卖家
            nft.safeTransferFrom(address(this), seller, nftId);
        }

        emit End(highestBidder, highestBid);
    }
}
