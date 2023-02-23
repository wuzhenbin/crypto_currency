const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("erc721a Unit Tests", function () {
        let owner, user1, user2, user3, MyMint, basicNft

        beforeEach(async () => {
            ;[owner, user1, user2, user3] = await ethers.getSigners()

            const NFTContract = await ethers.getContractFactory("BasicNft")
            basicNft = await NFTContract.deploy("Dogie", "DOG")

            const MyMintContract = await ethers.getContractFactory("MyMint")
            MyMint = await MyMintContract.deploy("Dogie", "DOG")
        })

        describe("Constructor", () => {
            it("Initializes the NFT Correctly.", async () => {
                const name = await MyMint.name()
                const symbol = await MyMint.symbol()
                assert.equal(name, "Dogie")
                assert.equal(symbol, "DOG")
                expect(await MyMint.totalSupply()).to.equal(0)
            })
        })

        describe("main", () => {
            it("mint", async () => {
                await MyMint.setMint(true)
                await MyMint.mint(1)
                expect(await MyMint.totalSupply()).to.equal(1)
            })

            it("set base uri", async () => {
                const setUri = await MyMint.setBaseUri("https://example.com/")
                await setUri.wait()

                await MyMint.setMint(true)
                await MyMint.mint(1)

                expect(await MyMint.baseUri()).to.equal("https://example.com/")
                expect(await MyMint.tokenURI(1)).to.equal(
                    "https://example.com/1.json"
                )
            })
        })

        describe("mint gas", () => {
            it("mint 10 nft", async () => {
                const mintAmount = 10
                let tx = await basicNft.mintMultNft(mintAmount)
                let receipt = await tx.wait()
                let gasUse1 = receipt.cumulativeGasUsed
                // 593506
                console.log(gasUse1.toString())

                await MyMint.setMint(true)
                tx = await MyMint.mint(mintAmount)
                receipt = await tx.wait()
                let gasUse2 = receipt.cumulativeGasUsed
                // 112624
                console.log(gasUse2.toString())
            })
        })
    })
}
