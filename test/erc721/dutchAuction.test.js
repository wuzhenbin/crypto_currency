// We are going to skip a bit on these tests...

const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { eth2big } = require("../../utils/utils")
// 获取合约或账户余额
const getBalance = ethers.provider.getBalance

if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("dutch auction Unit Tests", function () {
        let owner, user1, Dutch

        beforeEach(async () => {
            ;[owner, user1] = await ethers.getSigners()

            // deploy faucet
            const dutchContract = await ethers.getContractFactory(
                "DutchAuction"
            )
            Dutch = await dutchContract.deploy()
        })

        describe("Constructor", () => {
            it("Initializes the NFT Correctly.", async () => {
                const name = await Dutch.name()
                const symbol = await Dutch.symbol()
                const total = await Dutch.totalSupply()
                assert.equal(name, "Dutch Auction")
                assert.equal(symbol, "Dutch Auction")
                assert.equal(total.toString(), "0")
            })
        })

        describe("auctionMint", () => {
            it("auctionMint over amount", async function () {
                await expect(
                    Dutch.auctionMint(10001)
                ).to.be.revertedWithCustomError(
                    Dutch,
                    "DutchAuction__OverAmount"
                )
            })
            it("auctionMint not enough eth", async function () {
                await expect(
                    Dutch.auctionMint(5, { value: eth2big(1) })
                ).to.be.revertedWithCustomError(
                    Dutch,
                    "DutchAuction__NeedMoreETH"
                )
            })
            it("auctionMint success", async function () {
                await Dutch.auctionMint(5, { value: eth2big(5) })
                expect(await Dutch.balanceOf(owner.address)).to.equal(5)
            })
        })

        describe("getAuctionPrice", () => {
            it("auction not start", async function () {
                const ts = parseInt(new Date().valueOf() / 1000) + 1000
                await Dutch.setAuctionStartTime(ts)
                expect(await Dutch.getAuctionPrice()).to.equal(eth2big(1))
            })

            it("getAuctionPrice pass 10 minutes", async function () {
                await network.provider.send("evm_increaseTime", [10 * 60])
                await network.provider.send("evm_mine")
                expect(await Dutch.getAuctionPrice()).to.equal(eth2big(0.1))
            })

            it("getAuctionPrice pass process", async function () {
                // 过了 2分钟 折扣 0.18
                await network.provider.send("evm_increaseTime", [2 * 60])
                await network.provider.send("evm_mine")

                expect(await Dutch.getAuctionPrice()).to.equal(eth2big(0.82))

                // 过了 5分钟 折扣 0.45
                await network.provider.send("evm_increaseTime", [3 * 60])
                await network.provider.send("evm_mine")

                expect(await Dutch.getAuctionPrice()).to.equal(eth2big(0.55))
            })
        })

        describe("withdrawMoney", () => {
            it("auction not start", async function () {
                // 过了 10分钟 价格为 0.1
                await network.provider.send("evm_increaseTime", [10 * 60])
                await network.provider.send("evm_mine")

                await Dutch.connect(user1).auctionMint(5, {
                    value: eth2big(0.5),
                })

                let balance = await getBalance(owner.address)

                let tx = await Dutch.withdrawMoney()
                const receipt = await tx.wait()
                const gasFee = receipt.cumulativeGasUsed.mul(
                    receipt.effectiveGasPrice
                )
                balance = (await getBalance(owner.address))
                    .sub(balance)
                    .add(gasFee)
                // 多出的钱就是 卖出nft的钱 5 * 0.1 = 0.5, 扣掉提现的gas费
                expect(balance).to.equal(eth2big(0.5))
            })
        })
    })
}
