const { assert, expect } = require("chai")
const { network, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { eth2big } = require("../../utils/utils")

// 获取合约或账户余额
const getBalance = ethers.provider.getBalance

if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("Faucet Unit Tests", function () {
        let owner, user1, user2, user3, Token, Faucept
        beforeEach(async () => {
            ;[owner, user1, user2, user3] = await ethers.getSigners()
            const TokenContract = await ethers.getContractFactory(
                "ERC20FixedSupply"
            )
            // default mint 10eth
            Token = await TokenContract.deploy("Bitcoin", "BTC", 10)

            // deploy faucet
            const FauceptContract = await ethers.getContractFactory("Faucet")
            Faucept = await FauceptContract.deploy(Token.address)

            // for faucet mint 200 wei
            Token.mint(Faucept.address, 200)
        })

        it("requestTokens", async () => {
            await Faucept.connect(user1).requestTokens()
            expect(await Token.balanceOf(user1.address)).to.equal(100)
        })
        it("requestTokens Requested", async () => {
            await Faucept.connect(user1).requestTokens()
            await expect(
                Faucept.connect(user1).requestTokens()
            ).to.be.revertedWithCustomError(Faucept, "Faucet_Requested")
        })
        it("requestTokens Pool Empty", async () => {
            await Faucept.connect(user1).requestTokens()
            await Faucept.connect(user2).requestTokens()

            await expect(
                Faucept.connect(user3).requestTokens()
            ).to.be.revertedWithCustomError(Faucept, "Faucet_Empty")
        })
    })
}
