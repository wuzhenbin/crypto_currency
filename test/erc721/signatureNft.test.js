const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

const keccak256 = require("keccak256")

if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("SignatureNFT NFT Unit Tests", function () {
        let owner, user1, SignatureNFT

        beforeEach(async () => {
            ;[owner, user1] = await ethers.getSigners()

            // deploy library
            const ECDSALibFactory = await ethers.getContractFactory("ECDSA")
            const ECDSALib = await ECDSALibFactory.deploy()
            await ECDSALib.deployed()

            const NFTContract = await ethers.getContractFactory(
                "SignatureNFT",
                {
                    libraries: { ECDSA: ECDSALib.address },
                }
            )

            SignatureNFT = await NFTContract.deploy(
                "Dogie",
                "DOG",
                owner.address
            )
        })

        describe("verify", () => {
            it("verify fail and pass", async function () {
                const to = user1.address
                const tokenId = 0
                const hash = await SignatureNFT.getMessageHash(to, tokenId)
                const sig = await owner.signMessage(ethers.utils.arrayify(hash))

                // let res = await SignatureNFT.verify(to, 1, sig)
                expect(await SignatureNFT.verify(to, 1, sig)).to.equal(false)
                expect(await SignatureNFT.verify(to, tokenId, sig)).to.equal(
                    true
                )
            })
        })

        describe("mint", () => {
            let to, tokenId, hash, sig
            beforeEach(async () => {
                to = user1.address
                tokenId = 0
                hash = await SignatureNFT.getMessageHash(to, tokenId)
                sig = await owner.signMessage(ethers.utils.arrayify(hash))
            })

            it("invalid signature", async function () {
                await expect(
                    SignatureNFT.mint(to, 1, sig)
                ).to.be.revertedWithCustomError(
                    SignatureNFT,
                    "SignatureNFT__InvalidSignature"
                )
            })

            it("already minted", async function () {
                await SignatureNFT.mint(to, tokenId, sig)
                await expect(
                    SignatureNFT.mint(to, tokenId, sig)
                ).to.be.revertedWithCustomError(
                    SignatureNFT,
                    "SignatureNFT__AlreadyMinted"
                )
            })

            it("mint success", async function () {
                await SignatureNFT.mint(to, tokenId, sig)
                expect(await SignatureNFT.ownerOf("0")).to.equal(user1.address)
            })
        })
    })
}
