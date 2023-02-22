// We are going to skip a bit on these tests...

const { assert } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("Basic NFT Unit Tests", function () {
        let owner, user1, user2, user3, basicNft

        beforeEach(async () => {
            ;[owner, user1, user2, user3] = await ethers.getSigners()

            const NFTContract = await ethers.getContractFactory("BasicNft")
            basicNft = await NFTContract.deploy("Dogie", "DOG")
        })

        describe("Constructor", () => {
            it("Initializes the NFT Correctly.", async () => {
                const name = await basicNft.name()
                const symbol = await basicNft.symbol()
                const tokenCounter = await basicNft.getTokenCounter()
                assert.equal(name, "Dogie")
                assert.equal(symbol, "DOG")
                assert.equal(tokenCounter.toString(), "0")
            })
        })

        describe("Mint NFT", () => {
            beforeEach(async () => {
                const txResponse = await basicNft.mintNft()
                await txResponse.wait(1)
            })
            it("Allows users to mint an NFT, and updates appropriately", async function () {
                const tokenURI = await basicNft.tokenURI(0)
                const tokenCounter = await basicNft.getTokenCounter()

                assert.equal(tokenCounter.toString(), "1")
                assert.equal(tokenURI, await basicNft.TOKEN_URI())
            })
            it("Show the correct balance and owner of an NFT", async function () {
                const deployerBalance = await basicNft.balanceOf(owner.address)
                // nft owner
                assert.equal(deployerBalance.toString(), "1")
                assert.equal(await basicNft.ownerOf("0"), owner.address)
            })
        })
    })
}
