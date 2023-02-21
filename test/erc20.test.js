const { assert, expect } = require("chai")
const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { eth2big } = require("../utils/utils")

if (!developmentChains.includes(network.name)) {
    describe.skip
} else {
    describe("ERC20 Unit Tests", function () {
        it("ERC20 Base", async () => {
            let [owner] = await ethers.getSigners()
            const TokenContract = await ethers.getContractFactory(
                "ERC20FixedSupply"
            )
            // 默认铸造 10eth
            const BtcToken = await TokenContract.deploy("Bitcoin", "BTC", 10)
            // 查询账户余额
            let balance = await BtcToken.balanceOf(owner.address)
            expect(balance).to.equal(eth2big(10))
            // 铸币总额
            let totalSupply = await BtcToken.totalSupply()
            expect(totalSupply).to.equal(eth2big(10))
        })
    })
}
