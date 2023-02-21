const { assert, expect } = require("chai")
const { network, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { eth2big } = require("../../utils/utils")

// 获取合约或账户余额
const getBalance = ethers.provider.getBalance

if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("ERC20 Unit Tests", function () {
        let owner, Token
        beforeEach(async () => {
            ;[owner] = await ethers.getSigners()
            const TokenContract = await ethers.getContractFactory(
                "ERC20FixedSupply"
            )
            // 默认铸造 10eth
            Token = await TokenContract.deploy("Bitcoin", "BTC", 10)
        })

        it("token is deployed", async () => {
            // 查询账户余额
            let balance = await Token.balanceOf(owner.address)
            expect(balance).to.equal(eth2big(10))
            // 铸币总额
            let totalSupply = await Token.totalSupply()
            expect(totalSupply).to.equal(eth2big(10))
        })
    })

    describe("Airdrop Unit Tests", function () {
        let owner, addr1, addr2, addr3, Token, AirDrop
        beforeEach(async () => {
            ;[owner, user1, user2, user3] = await ethers.getSigners()
            addr1 = user1.address
            addr2 = user2.address
            addr3 = user3.address
            const TokenContract = await ethers.getContractFactory(
                "ERC20FixedSupply"
            )
            // 默认铸造 10eth
            Token = await TokenContract.deploy("Bitcoin", "BTC", 10)
            // deploy 空投合约
            const AirDropContract = await ethers.getContractFactory("Airdrop")
            AirDrop = await AirDropContract.deploy()
        })
        it("getSum", async () => {
            const arr = [1, 2, 3, 4, 5]
            expect(await AirDrop.getSum(arr)).to.equal(15)
        })
        it("multiTransferToken Wrong length", async () => {
            const users = [addr1, addr2, addr3]
            // 地址跟数量对不上
            await expect(
                AirDrop.multiTransferToken(Token.address, users, [1, 2])
            ).to.be.revertedWithCustomError(AirDrop, "Airdrop__IllLength")
        })

        it("multiTransferToken Over Amount", async () => {
            const users = [addr1, addr2, addr3]
            const amountsBig = [eth2big(5), eth2big(5), eth2big(5)]

            // owner授权给合约进行空投
            await Token.approve(AirDrop.address, eth2big(10))
            await expect(
                AirDrop.multiTransferToken(Token.address, users, amountsBig)
            ).to.be.revertedWithCustomError(AirDrop, "Airdrop__OverAmount")
        })

        it("multiTransferToken", async () => {
            const users = [addr1, addr2, addr3]
            const amounts = [10000, 20000, 30000]

            let amount = amounts.reduce((a, b) => a + b)

            // owner授权给合约进行空投
            await Token.approve(AirDrop.address, amount)
            await AirDrop.multiTransferToken(Token.address, users, amounts)

            // 查询账户余额
            let balance1 = await Token.balanceOf(addr1)
            let balance2 = await Token.balanceOf(addr2)
            let balance3 = await Token.balanceOf(addr3)
            expect(balance1).to.equal(amounts[0])
            expect(balance2).to.equal(amounts[1])
            expect(balance3).to.equal(amounts[2])
        })

        it("multiTransferETH", async () => {
            const users = [addr1, addr2, addr3]
            const amounts = [10000, 20000, 30000]

            let amount = amounts.reduce((a, b) => a + b)

            let balance1 = await getBalance(addr1)
            let balance2 = await getBalance(addr2)
            let balance3 = await getBalance(addr3)

            // owner授权给合约进行空投
            await AirDrop.multiTransferETH(users, amounts, { value: amount })

            // 查询账户余额
            const newMore1 = (await getBalance(addr1)).sub(balance1)
            const newMore2 = (await getBalance(addr2)).sub(balance2)
            const newMore3 = (await getBalance(addr3)).sub(balance3)

            expect(newMore1).to.equal(amounts[0])
            expect(newMore2).to.equal(amounts[1])
            expect(newMore3).to.equal(amounts[2])
        })
    })
}
