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
}
