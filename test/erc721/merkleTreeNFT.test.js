const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

const { MerkleTree } = require("merkletreejs")
const keccak256 = require("keccak256")

if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("MerkleTree NFT Unit Tests", function () {
        let owner, user1, user2, user3, merkleTreeNft, tree

        beforeEach(async () => {
            ;[owner, user1, user2, user3, user4] = await ethers.getSigners()

            const NFTContract = await ethers.getContractFactory("MerkleTreeNFT")

            const leaves = [
                user1.address,
                user2.address,
                user3.address,
                user4.address,
            ]
            tree = new MerkleTree(leaves, keccak256, {
                sortPairs: true,
                hashLeaves: true,
            })
            const root = `0x${tree.getRoot().toString("hex")}`
            merkleTreeNft = await NFTContract.deploy("Dogie", "DOG", root)
        })

        describe("verify", () => {
            it("verify fail and pass", async function () {
                let leaf = keccak256(
                    "0xC75A79a61c6E828c7D58a321C44e6B1fdbAA4055"
                )
                let proof = tree
                    .getProof(leaf)
                    .map((x) => `0x${x.data.toString("hex")}`)
                expect(await merkleTreeNft.verify(proof, leaf)).to.equal(false)

                leaf = keccak256(user1.address)
                proof = tree
                    .getProof(leaf)
                    .map((x) => `0x${x.data.toString("hex")}`)
                expect(await merkleTreeNft.verify(proof, leaf)).to.equal(true)
            })
        })

        describe("mint", () => {
            it("invalid proof", async function () {
                let leaf = keccak256(
                    "0xC75A79a61c6E828c7D58a321C44e6B1fdbAA4055"
                )
                let proof = tree
                    .getProof(leaf)
                    .map((x) => `0x${x.data.toString("hex")}`)

                await expect(
                    merkleTreeNft.mint(
                        "0xC75A79a61c6E828c7D58a321C44e6B1fdbAA4055",
                        0,
                        proof
                    )
                ).to.be.revertedWithCustomError(
                    merkleTreeNft,
                    "MerkleTreeNFT__InvalidProof"
                )
            })

            it("already minted", async function () {
                let leaf = keccak256(user1.address)
                let proof = tree
                    .getProof(leaf)
                    .map((x) => `0x${x.data.toString("hex")}`)

                await merkleTreeNft.mint(user1.address, 0, proof)
                await expect(
                    merkleTreeNft.mint(user1.address, 1, proof)
                ).to.be.revertedWithCustomError(
                    merkleTreeNft,
                    "MerkleTreeNFT__AlreadyMinted"
                )
            })

            it("mint success", async function () {
                let leaf = keccak256(user1.address)
                let proof = tree
                    .getProof(leaf)
                    .map((x) => `0x${x.data.toString("hex")}`)

                await merkleTreeNft.mint(user1.address, 0, proof)
                expect(await merkleTreeNft.ownerOf("0")).to.equal(user1.address)
            })
        })
    })
}
