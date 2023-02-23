const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { eth2big } = require("../../utils/utils")
const getBalance = ethers.provider.getBalance

/* 
1 deploy nft, mint 2 nft to user
2 deploy nft_swap
3 approve nft to nft_swap
4 list nfts
5 buy the nfts
6 cancel a listing
7 updateListing
8 withdraw payment for my bought nfts
*/
if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("NFT SWAP Unit Tests", function () {
        let owner, user1, user2, user3, basicNft, NFTSwap

        beforeEach(async () => {
            ;[owner, user1, user2, user3] = await ethers.getSigners()

            // deploy BasicNft
            const NFTContract = await ethers.getContractFactory("BasicNft")
            basicNft = await NFTContract.deploy("Dogie", "DOG")

            // mint 2 nft for owner
            await basicNft.mintNft()
            await basicNft.mintNft()

            // deploy NFTSwap
            const NFTSwapContract = await ethers.getContractFactory("NFTSwap")
            NFTSwap = await NFTSwapContract.deploy()
        })

        describe("contracts deployed", () => {
            it("Initializes the NFT Correctly.", async () => {
                expect(await basicNft.balanceOf(owner.address)).to.equal(2)
            })

            it("Approve the NFT Correctly.", async () => {
                // approve nft to NFTSwap
                await basicNft.approve(NFTSwap.address, 0)
                await basicNft.approve(NFTSwap.address, 1)

                expect(await basicNft.getApproved(0)).to.equal(NFTSwap.address)
                expect(await basicNft.getApproved(1)).to.equal(NFTSwap.address)
            })
        })

        describe("List NFT", () => {
            it("not approve", async () => {
                await expect(
                    NFTSwap.list(basicNft.address, 0, 1)
                ).to.be.revertedWithCustomError(NFTSwap, "NFTSwap__NeedApprove")
            })
            it("price zero", async () => {
                await expect(NFTSwap.list(basicNft.address, 0, 0)).to.be
                    .reverted
            })

            it("list success", async () => {
                await basicNft.approve(NFTSwap.address, 0)

                // get event
                await expect(NFTSwap.list(basicNft.address, 0, eth2big(0.5)))
                    .to.emit(NFTSwap, "List")
                    .withArgs(owner.address, basicNft.address, 0, eth2big(0.5))

                //  token0 => NFTSwap, banlace => 1
                expect(await basicNft.balanceOf(owner.address)).to.equal(1)

                // check nftList
                let res = await NFTSwap.nftList(basicNft.address, 0)
                expect(res.owner).to.equal(owner.address)
                expect(res.price).to.equal(eth2big(0.5))
            })
        })

        describe("Update NFT", () => {
            it("price zero", async () => {
                await basicNft.approve(NFTSwap.address, 0)
                NFTSwap.list(basicNft.address, 0, eth2big(0.5))
                await expect(
                    NFTSwap.update(basicNft.address, 0, 0)
                ).to.be.revertedWithCustomError(
                    NFTSwap,
                    "NFTSwap__InvalidPrice"
                )
            })

            it("only owner can update", async () => {
                await basicNft.approve(NFTSwap.address, 0)
                NFTSwap.list(basicNft.address, 0, eth2big(0.5))

                await expect(
                    NFTSwap.connect(user1).update(
                        basicNft.address,
                        0,
                        eth2big(1)
                    )
                ).to.be.revertedWithCustomError(NFTSwap, "NFTSwap__NotOwner")
            })

            it("update nft new price", async () => {
                await basicNft.approve(NFTSwap.address, 0)
                await NFTSwap.list(basicNft.address, 0, eth2big(0.5))
                await NFTSwap.update(basicNft.address, 0, eth2big(1))
                // check nftList
                let res = await NFTSwap.nftList(basicNft.address, 0)
                expect(res.price).to.equal(eth2big(1))
            })
        })

        describe("Revoke NFT", () => {
            it("only owner can revoke", async () => {
                await basicNft.approve(NFTSwap.address, 0)
                NFTSwap.list(basicNft.address, 0, eth2big(0.5))

                await expect(
                    NFTSwap.connect(user1).revoke(basicNft.address, 0)
                ).to.be.revertedWithCustomError(NFTSwap, "NFTSwap__NotOwner")
            })

            it("Revoke NFT success", async () => {
                await basicNft.approve(NFTSwap.address, 0)
                await NFTSwap.list(basicNft.address, 0, eth2big(0.5))
                await NFTSwap.revoke(basicNft.address, 0)
                expect(await basicNft.balanceOf(owner.address)).to.equal(2)
            })
        })

        describe("Purchase NFT", () => {
            it("not enought", async () => {
                await basicNft.approve(NFTSwap.address, 0)
                await NFTSwap.list(basicNft.address, 0, eth2big(0.5))

                await expect(
                    NFTSwap.connect(user1).purchase(basicNft.address, 0, {
                        value: eth2big(0.1),
                    })
                ).to.be.revertedWithCustomError(NFTSwap, "NFTSwap__NotEnough")
            })

            it("purchase success", async () => {
                await basicNft.approve(NFTSwap.address, 0)
                await NFTSwap.list(basicNft.address, 0, eth2big(0.5))

                let balance = await getBalance(owner.address)

                await NFTSwap.connect(user1).purchase(basicNft.address, 0, {
                    value: eth2big(0.5),
                })
                // saller get the money
                let getMoney = (await getBalance(owner.address)).sub(balance)
                expect(getMoney).to.equal(eth2big(0.5))

                // user1 get the NFT
                expect(await basicNft.ownerOf(0)).to.equal(user1.address)
            })
        })
    })
}
