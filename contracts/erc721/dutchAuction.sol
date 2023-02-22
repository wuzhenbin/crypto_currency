// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "hardhat/console.sol";

error DutchAuction__OverAmount();
error DutchAuction__NeedMoreETH();

contract DutchAuction is Ownable, ERC721 {
    // NFT总数
    uint256 public constant COLLECTOIN_SIZE = 10000;
    // 起拍价
    uint256 public constant AUCTION_START_PRICE = 1 ether;
    // 结束价（最低价）
    uint256 public constant AUCTION_END_PRICE = 0.1 ether;
    // 拍卖时间, 为了测试方便设为10分钟
    uint256 public constant AUCTION_TIME = 10 minutes;
    // 单位时间, 价格衰减一次
    uint256 public constant AUCTION_DROP_INTERVAL = 1 minutes;

    // 拍卖开始时间戳
    uint256 public auctionStartTime;

    // metadata URI
    string private _baseTokenURI;
    // 记录所有存在的tokenId
    uint256[] private _allTokens;

    // 设定拍卖起始时间: 我们在构造函数中会声明当前区块时间为起始时间, 项目方也可以通过`setAuctionStartTime(uint32)`函数来调整
    constructor() ERC721("Dutch Auction", "Dutch Auction") {
        auctionStartTime = block.timestamp;
    }

    /**
     * ERC721Enumerable中totalSupply函数的实现
     */
    function totalSupply() public view virtual returns (uint256) {
        return _allTokens.length;
    }

    /**
     * Private函数, 在_allTokens中添加一个新的token
     */
    function _addTokenToAllTokensEnumeration(uint256 tokenId) private {
        _allTokens.push(tokenId);
    }

    // 拍卖mint函数
    function auctionMint(uint256 quantity) external payable {
        // 建立local变量, 减少gas花费
        uint256 _saleStartTime = uint256(auctionStartTime);
        // 检查是否设置起拍时间, 拍卖是否开始
        require(
            _saleStartTime != 0 && block.timestamp >= _saleStartTime,
            "sale has not started yet"
        );
        // 检查是否超过NFT上限
        if (totalSupply() + quantity > COLLECTOIN_SIZE) {
            revert DutchAuction__OverAmount();
        }

        // 计算mint成本
        uint256 totalCost = getAuctionPrice() * quantity;
        // 检查用户是否支付足够ETH
        if (msg.value < totalCost) {
            revert DutchAuction__NeedMoreETH();
        }

        // Mint NFT
        for (uint256 i = 0; i < quantity; i++) {
            uint256 mintIndex = totalSupply();
            _mint(msg.sender, mintIndex);
            _addTokenToAllTokensEnumeration(mintIndex);
        }
        // 多余ETH退款
        if (msg.value > totalCost) {
            // 注意一下这里是否有重入的风险
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    // 获取拍卖实时价格
    function getAuctionPrice() public view returns (uint256) {
        // 拍卖还没开始
        if (block.timestamp < auctionStartTime) {
            return AUCTION_START_PRICE;
        }
        // 拍卖结束 此时价格最低
        else if (block.timestamp - auctionStartTime >= AUCTION_TIME) {
            return AUCTION_END_PRICE;
        } else {
            // 拍卖了多少单位的时间
            uint256 steps = (block.timestamp - auctionStartTime) /
                AUCTION_DROP_INTERVAL;

            /* 
            起拍价 - 1
            结束价 - 0.1
            拍卖时间 - 10分钟
            单位时间 - 1分钟
            假设已经过了 5分钟

            discount = (1 - 0.1) * (5 / (10/1)) = 0.45
            price = 1 - discount = 0.55
            */
            uint256 discount = ((AUCTION_START_PRICE - AUCTION_END_PRICE) *
                steps) / (AUCTION_TIME / AUCTION_DROP_INTERVAL);
            return AUCTION_START_PRICE - discount;
        }
    }

    // auctionStartTime setter函数, onlyOwner
    function setAuctionStartTime(uint32 timestamp) external onlyOwner {
        auctionStartTime = timestamp;
    }

    // BaseURI
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    // BaseURI setter函数, onlyOwner
    function setBaseURI(string calldata baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    // 提款函数, onlyOwner
    function withdrawMoney() external onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }
}
