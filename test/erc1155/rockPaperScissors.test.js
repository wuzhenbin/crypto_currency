const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("ERC1155 Unit Tests", function () {
        let owner, user1, user2, user3, rockPaper

        beforeEach(async () => {
            ;[owner, user1, user2, user3] = await ethers.getSigners()

            const rockPaperContract = await ethers.getContractFactory(
                "rockPaperScissors"
            )
            rockPaper = await rockPaperContract.deploy()
        })

        describe("Constructor", () => {
            it("Initializes Correctly.", async () => {
                expect(await rockPaper.balanceOf(owner.address, 1)).to.equal(1)
                expect(await rockPaper.balanceOf(owner.address, 2)).to.equal(5)
                expect(await rockPaper.balanceOf(owner.address, 3)).to.equal(10)
            })
        })

        describe("safeTransferFrom", () => {
            it("transfer token correctly", async () => {
                await rockPaper.safeTransferFrom(
                    owner.address,
                    user1.address,
                    2,
                    3,
                    "0x"
                )
                expect(await rockPaper.balanceOf(owner.address, 2)).to.equal(2)
                expect(await rockPaper.balanceOf(user1.address, 2)).to.equal(3)
            })
        })

        describe("mint token", () => {
            it("amount correctly", async () => {
                await rockPaper.safeTransferFrom(
                    owner.address,
                    user1.address,
                    2,
                    3,
                    "0x"
                )
                await rockPaper.mint(owner.address, 2, 10)
                // 5 - 3 + 10
                expect(await rockPaper.balanceOf(owner.address, 2)).to.equal(12)
                expect(await rockPaper.balanceOf(user1.address, 2)).to.equal(3)
            })
        })
    })
}
