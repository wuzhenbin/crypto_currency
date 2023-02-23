/*
// nft交易所的功能
create a decentralized nft marketplace
1 list nfts
2 buy the nfts
3 cancel a listing
4 updateListing
5 withdraw payment for my bought nfts

// 方法1: 发送nft到合约 合约拥有nft 这种gas太多
// 方法2: owner仍然持有nft 但是授权给合约售卖 可以随时撤回授权
// getApproved 可以获取批准情况
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

error NFTSwap__NeedApprove();
error NFTSwap__InvalidPrice();
error NFTSwap__NotOwner();
error NFTSwap__InvaildOrder();
error NFTSwap__NotEnough();

contract NFTSwap is IERC721Receiver {
    event List(
        address indexed seller,
        address indexed nftAddr,
        uint256 indexed tokenId,
        uint256 price
    );
    event Purchase(
        address indexed buyer,
        address indexed nftAddr,
        uint256 indexed tokenId,
        uint256 price
    );
    event Revoke(
        address indexed seller,
        address indexed nftAddr,
        uint256 indexed tokenId
    );
    event Update(
        address indexed seller,
        address indexed nftAddr,
        uint256 indexed tokenId,
        uint256 newPrice
    );

    struct Order {
        address owner;
        uint256 price;
    }
    mapping(address => mapping(uint256 => Order)) public nftList;

    receive() external payable {}

    fallback() external payable {}

    function list(address _nftAddr, uint256 _tokenId, uint256 _price) public {
        IERC721 _nft = IERC721(_nftAddr);
        if (_nft.getApproved(_tokenId) != address(this)) {
            revert NFTSwap__NeedApprove();
        }
        require(_price > 0);

        // 设置NFT持有人和价格
        Order storage _order = nftList[_nftAddr][_tokenId];
        _order.owner = msg.sender;
        _order.price = _price;

        _nft.safeTransferFrom(msg.sender, address(this), _tokenId);

        emit List(msg.sender, _nftAddr, _tokenId, _price);
    }

    // buy NFT
    function purchase(address _nftAddr, uint256 _tokenId) public payable {
        Order storage _order = nftList[_nftAddr][_tokenId];
        if (_order.price <= 0) {
            revert NFTSwap__InvalidPrice();
        }

        if (msg.value < _order.price) {
            revert NFTSwap__NotEnough();
        }

        IERC721 _nft = IERC721(_nftAddr);
        if (_nft.ownerOf(_tokenId) != address(this)) {
            revert NFTSwap__InvaildOrder();
        }

        _nft.safeTransferFrom(address(this), msg.sender, _tokenId);

        // money => saller
        payable(_order.owner).transfer(_order.price);
        // left money to back buyer
        payable(msg.sender).transfer(msg.value - _order.price);

        delete nftList[_nftAddr][_tokenId];

        emit Purchase(msg.sender, _nftAddr, _tokenId, msg.value);
    }

    // cancel order
    function revoke(address _nftAddr, uint256 _tokenId) public {
        Order storage _order = nftList[_nftAddr][_tokenId];
        if (_order.owner != msg.sender) {
            revert NFTSwap__NotOwner();
        }

        IERC721 _nft = IERC721(_nftAddr);
        if (_nft.ownerOf(_tokenId) != address(this)) {
            revert NFTSwap__InvaildOrder();
        }

        _nft.safeTransferFrom(address(this), msg.sender, _tokenId);
        delete nftList[_nftAddr][_tokenId];

        emit Revoke(msg.sender, _nftAddr, _tokenId);
    }

    function update(
        address _nftAddr,
        uint256 _tokenId,
        uint256 _newPrice
    ) public {
        if (_newPrice <= 0) {
            revert NFTSwap__InvalidPrice();
        }

        // only owner can update
        Order storage _order = nftList[_nftAddr][_tokenId];
        if (_order.owner != msg.sender) {
            revert NFTSwap__NotOwner();
        }

        // contract get the nft
        IERC721 _nft = IERC721(_nftAddr);
        if (_nft.ownerOf(_tokenId) != address(this)) {
            revert NFTSwap__InvaildOrder();
        }

        _order.price = _newPrice;

        emit Update(msg.sender, _nftAddr, _tokenId, _newPrice);
    }

    function onERC721Received(
        address /*operator*/,
        address /*from*/,
        uint /*tokenId*/,
        bytes calldata /*data*/
    ) external pure override returns (bytes4) {
        return IERC721Receiver.onERC721Received.selector;
    }
}
