// We are going to skip a bit on these tests...

const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { eth2big } = require("../../utils/utils")
// 获取合约或账户余额
const getBalance = ethers.provider.getBalance

const moreTimes = async (more_sec) => {
    await network.provider.send("evm_increaseTime", [more_sec])
    await network.provider.send("evm_mine")
}

if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("english auction Unit Tests", function () {
        let owner, user1, user2, user3, basicNft, Dutch

        beforeEach(async () => {
            ;[owner, user1, user2, user3] = await ethers.getSigners()

            const NFTContract = await ethers.getContractFactory("BasicNft")
            basicNft = await NFTContract.deploy("Dogie", "DOG")
            await basicNft.mintNft()

            const dutchContract = await ethers.getContractFactory(
                "EnglishAuction"
            )
            Dutch = await dutchContract.deploy(
                basicNft.address,
                0,
                eth2big(0.1)
            )
            await basicNft.approve(Dutch.address, 0)
        })

        describe("Constructor", () => {
            it("Initializes the Auction Correctly.", async () => {
                expect(await Dutch.nftId()).to.equal(0)
                expect(await Dutch.seller()).to.equal(owner.address)
                expect(await Dutch.highestBid()).to.equal(eth2big(0.1))
            })
        })

        describe("Start", () => {
            it("Start Twice", async () => {
                await Dutch.start()
                await expect(Dutch.start()).to.be.revertedWithCustomError(
                    Dutch,
                    "EnglishAuction__Started"
                )
            })

            it("Start Not Owner", async () => {
                await expect(
                    Dutch.connect(user1).start()
                ).to.be.revertedWithCustomError(
                    Dutch,
                    "EnglishAuction__NotOwner"
                )
            })

            it("Start event", async () => {
                await expect(Dutch.start()).to.emit(Dutch, "Start")
            })
        })

        describe("Bid", () => {
            it("not start", async () => {
                await expect(Dutch.bid()).to.be.revertedWithCustomError(
                    Dutch,
                    "EnglishAuction__NotStarted"
                )
            })
            it("auction ended", async () => {
                await Dutch.start()
                // pass 7 days
                await moreTimes(7 * 24 * 60 * 60)
                await expect(Dutch.bid()).to.be.revertedWithCustomError(
                    Dutch,
                    "EnglishAuction__Ended"
                )
            })

            it("bid not highest", async () => {
                await Dutch.start()
                await expect(
                    Dutch.connect(user1).bid({ value: eth2big(0.05) })
                ).to.be.revertedWithCustomError(
                    Dutch,
                    "EnglishAuction__NotHighest"
                )
            })
            it("bid success", async () => {
                await Dutch.start()
                await Dutch.connect(user1).bid({ value: eth2big(0.11) })
                let highestBidder = await Dutch.highestBidder()
                let highestBid = await Dutch.highestBid()
                expect(highestBid).to.equal(eth2big(0.11))
                expect(highestBidder).to.equal(user1.address)
            })
        })

        describe("WithDraw", () => {
            it("with draw", async () => {
                await Dutch.start()
                await Dutch.connect(user1).bid({ value: eth2big(0.2) })
                await Dutch.connect(user2).bid({ value: eth2big(0.3) })
                await Dutch.connect(user1).bid({ value: eth2big(0.4) })
                await Dutch.connect(user2).bid({ value: eth2big(0.5) })

                let bal1 = await Dutch.bids(user1.address)
                let bal2 = await Dutch.bids(user2.address)
                expect(bal1).to.equal(eth2big(0.6))
                expect(bal2).to.equal(eth2big(0.3))

                let balance = await getBalance(user1.address)
                let tx = await Dutch.connect(user1).withdraw()
                const receipt = await tx.wait()
                const gasFee = receipt.cumulativeGasUsed.mul(
                    receipt.effectiveGasPrice
                )
                balance = (await getBalance(user1.address))
                    .sub(balance)
                    .add(gasFee)
                expect(balance).to.equal(eth2big(0.6))
            })
        })

        describe("End", () => {
            it("have buyer", async () => {
                // 拍卖阶段
                await Dutch.start()
                await Dutch.connect(user1).bid({ value: eth2big(0.2) })
                // 结束
                // pass 7 days
                let balance = await getBalance(owner.address)
                await moreTimes(7 * 24 * 60 * 60)

                await Dutch.connect(user3).end()

                // buyer get the nft
                expect(await basicNft.ownerOf("0")).to.equal(user1.address)
                // saler get the money
                balance = (await getBalance(owner.address)).sub(balance)
                expect(balance).to.equal(eth2big(0.2))
            })

            it("no buyer", async () => {
                // 拍卖阶段
                await Dutch.start()
                // 结束
                // pass 7 days
                await moreTimes(7 * 24 * 60 * 60)

                await Dutch.connect(user3).end()

                // saler get the nft back
                balance = await basicNft.balanceOf(owner.address)
                expect(balance).to.equal(1)
            })
        })
    })
}
