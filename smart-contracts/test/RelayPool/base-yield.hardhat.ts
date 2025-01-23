import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import { networks } from '@relay-protocol/networks'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { MyToken, MyYieldPool, RelayPool } from '../../typechain-types'

describe('RelayBridge: base yield', () => {
  let relayPool: RelayPool
  let myToken: MyToken
  let thirdPartyPool: MyYieldPool

  before(async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()

    myToken = await ethers.deployContract('MyToken', ['My Token', 'TOKEN'])
    expect(await myToken.totalSupply()).to.equal(1000000000000000000000000000n)

    // deploy 3rd party pool
    thirdPartyPool = await ethers.deployContract('MyYieldPool', [
      await myToken.getAddress(),
      'My Yield Pool',
      'YIELD',
    ])
    const thirdPartyPoolAddress = await thirdPartyPool.getAddress()

    // Add liquidity to the 3rd party pool
    await myToken.approve(thirdPartyPoolAddress, ethers.parseUnits('1', 18))
    await thirdPartyPool.deposit(ethers.parseUnits('1', 18), userAddress)

    // deploy the pool using ignition
    const parameters = {
      RelayPool: {
        hyperlaneMailbox: networks[1].hyperlaneMailbox,
        asset: await myToken.getAddress(),
        name: `${await myToken.name()} Relay Pool`,
        symbol: `${await myToken.symbol()}-REL`,
        origins: [],
        thirdPartyPool: thirdPartyPoolAddress,
        weth: ethers.ZeroAddress, // Not used in this test
        protocolFee: 0,
      },
    }
    ;({ relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
    }))
  })

  it('should deposit tokens into a base yield pool when a user deposits funds', async () => {
    const [user] = await ethers.getSigners()
    const amount = ethers.parseUnits('1', 18)
    const userAddress = await user.getAddress()
    const relayPoolAddress = await relayPool.getAddress()
    const thirdPartyPoolAddress = await thirdPartyPool.getAddress()

    const balanceThirdPartyPoolBefore = await myToken.balanceOf(
      thirdPartyPoolAddress
    )
    // Approved the Token to be spent by the RelayPool
    await (await myToken.connect(user).approve(relayPoolAddress, amount)).wait()

    // Deposit tokens to the RelayPool
    await relayPool.connect(user).deposit(amount, userAddress)

    // Check balances
    expect(await myToken.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await myToken.balanceOf(thirdPartyPoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount
    )
  })

  it('should deposit tokens into a base yield pool when a user mints shares', async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    const relayPoolAddress = await relayPool.getAddress()
    const thirdPartyPoolAddress = await thirdPartyPool.getAddress()
    const balanceThirdPartyPoolBefore = await myToken.balanceOf(
      thirdPartyPoolAddress
    )

    const newShares = ethers.parseUnits('0.4', 18)

    // Preview the mint to get the amount of tokens to be deposited
    const amount = await relayPool.previewMint(newShares)

    // Approve the Token to be spent by the RelayPool
    await myToken.connect(user).approve(await relayPool.getAddress(), amount)

    // Deposit tokens to the RelayPool
    await relayPool.connect(user).mint(newShares, userAddress)

    // Check balances
    expect(await myToken.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await myToken.balanceOf(thirdPartyPoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount
    )
  })

  it('should withdraw tokens from the base yield pool when withdrawing liquidity', async () => {
    const [user] = await ethers.getSigners()
    const amount = ethers.parseUnits('1', 18)
    const userAddress = await user.getAddress()
    const relayPoolAddress = await relayPool.getAddress()
    const thirdPartyPoolAddress = await thirdPartyPool.getAddress()

    const balanceThirdPartyPoolBefore = await myToken.balanceOf(
      thirdPartyPoolAddress
    )
    // Approved the Token to be spent by the RelayPool
    await (await myToken.connect(user).approve(relayPoolAddress, amount)).wait()

    // Deposit tokens to the RelayPool
    await relayPool.connect(user).deposit(amount, userAddress)

    // Check balances
    expect(await myToken.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await myToken.balanceOf(thirdPartyPoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount
    )

    // Withdraw tokens from the RelayPool
    const withdrawAmount = ethers.parseUnits('0.5', 18)
    await relayPool
      .connect(user)
      .withdraw(withdrawAmount, userAddress, userAddress)
    expect(await myToken.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await myToken.balanceOf(thirdPartyPoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount - withdrawAmount
    )
  })

  it('should withdraw tokens from the base yield pool when redeeming shares', async () => {
    const [user] = await ethers.getSigners()
    const amount = ethers.parseUnits('1', 18)
    const userAddress = await user.getAddress()
    const relayPoolAddress = await relayPool.getAddress()
    const thirdPartyPoolAddress = await thirdPartyPool.getAddress()

    const balanceThirdPartyPoolBefore = await myToken.balanceOf(
      thirdPartyPoolAddress
    )
    // Approved the Token to be spent by the RelayPool
    await (await myToken.connect(user).approve(relayPoolAddress, amount)).wait()

    // Deposit tokens to the RelayPool
    await relayPool.connect(user).deposit(amount, userAddress)

    // Check balances
    expect(await myToken.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await myToken.balanceOf(thirdPartyPoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount
    )

    // Withdraw tokens from the RelayPool
    const sharesToRedeem = await relayPool.balanceOf(userAddress)
    const amountToReceive = await relayPool.previewRedeem(sharesToRedeem)
    await relayPool
      .connect(user)
      .redeem(sharesToRedeem, userAddress, userAddress)
    expect(await myToken.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await myToken.balanceOf(thirdPartyPoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount - amountToReceive
    )
  })

  it('should handle yield from the base yield pool', async () => {
    const [user] = await ethers.getSigners()
    const amount = ethers.parseUnits('1', 18)
    const userAddress = await user.getAddress()
    const relayPoolAddress = await relayPool.getAddress()

    // Approved the Token to be spent by the RelayPool
    await (await myToken.connect(user).approve(relayPoolAddress, amount)).wait()
    // Deposit tokens to the RelayPool
    await relayPool.connect(user).deposit(amount, userAddress)

    const assetsBefore = await relayPool.totalAssets()
    const userSharesBefore = await relayPool.balanceOf(userAddress)
    const userSharesValueBefore =
      await relayPool.convertToAssets(userSharesBefore)

    // And now mint more tokens for the base yield pool (equivalent to it accruing yield)
    await myToken.mintFor(
      (amount * 20n) / 100n,
      await thirdPartyPool.getAddress()
    )

    // The pool has more assets
    const assetsAfter = await relayPool.totalAssets()
    expect(assetsAfter).to.be.greaterThan(assetsBefore)

    // The user should have the same amount of shares
    const userSharesAfter = await relayPool.balanceOf(userAddress)
    expect(userSharesAfter).to.be.equal(userSharesBefore)

    // And the value of a user's share should have increased
    const userSharesValueAfter =
      await relayPool.convertToAssets(userSharesAfter)
    expect(userSharesValueAfter).to.be.greaterThan(userSharesValueBefore)
  })

  describe('maxDeposit', () => {
    after(async () => {
      await thirdPartyPool.setMaxDeposit(ethers.MaxUint256)
    })
    it('should return the maximum amount of tokens that we can deposited in the yield pool', async () => {
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()
      const maxDeposit = await relayPool.maxDeposit(userAddress)
      expect(maxDeposit).to.be.equal(
        ethers.MaxUint256 -
          (await myToken.balanceOf(await thirdPartyPool.getAddress()))
      )
    })

    it('should return 0 if the pool already has a max deposit, even if this user has not deposited', async () => {
      const [user, user2, user3] = await ethers.getSigners()
      const userAddress = await user.getAddress()
      const relayPoolAddress = await relayPool.getAddress()
      const amount = ethers.parseUnits('1', 18)

      const balanceThirdPartyPoolBefore = await myToken.balanceOf(
        await thirdPartyPool.getAddress()
      )

      const currentDeposits = await myToken.balanceOf(
        await thirdPartyPool.getAddress()
      )
      // Add amount to the current deposits to set the new max!
      const maxDeposit = currentDeposits + amount
      // Set a max deposit on 3rd party pool
      await thirdPartyPool.setMaxDeposit(maxDeposit)

      // The user does not have tokens so they should be able to deposit.
      expect(await relayPool.balanceOf(await user2.getAddress())).to.be.equal(0)
      // But they can deposit, since we increased the max deposit
      expect(await relayPool.maxDeposit(await user2.getAddress())).to.be.equal(
        maxDeposit - balanceThirdPartyPoolBefore
      )
      await myToken.connect(user2).mint(amount)
      await myToken.connect(user2).approve(relayPoolAddress, amount)
      await relayPool.connect(user2).deposit(amount, userAddress)

      // And now try deposit event more, but we can't
      const user3Address = await user3.getAddress()
      expect(await relayPool.balanceOf(user3Address)).to.be.equal(0)
      expect(await relayPool.maxDeposit(user3Address)).to.be.equal(0)
    })
  })

  describe('maxWithdraw', () => {
    after(async () => {
      await thirdPartyPool.setMaxWithdraw(ethers.MaxUint256)
    })

    it("should return the user's balance of assets at most if the yieldPool has no limit", async () => {
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()
      const amount = ethers.parseUnits('1', 18)
      const relayPoolAddress = await relayPool.getAddress()

      const maxWithdrawBefore = await relayPool.maxWithdraw(userAddress)
      await myToken.connect(user).mint(amount)
      await myToken.connect(user).approve(relayPoolAddress, amount)
      await relayPool.connect(user).deposit(amount, userAddress)

      expect(await relayPool.maxWithdraw(userAddress)).to.be.equal(
        maxWithdrawBefore + amount
      )
    })

    // This test is skipped because we changed the behavior of the maxWithdraw function
    // Indeed, this function should _not_ take into account the underlying pool's balance,
    // because it would then break the redeem flow since redeeming shares as we may end up in a
    // situation where the assets pulled from the underlying pool are MORE than the assets about to be
    // redeemed, even though they have already been accounted for.
    it.skip("should return at most the relay pool's balance from the yieldPool", async () => {
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()
      const amount = ethers.parseUnits('1', 18)
      const relayPoolAddress = await relayPool.getAddress()

      const maxWithdrawBefore = await relayPool.maxWithdraw(userAddress)
      await myToken.connect(user).mint(amount)
      await myToken.connect(user).approve(relayPoolAddress, amount)
      await relayPool.connect(user).deposit(amount, userAddress)

      expect(await relayPool.maxWithdraw(userAddress)).to.be.equal(
        maxWithdrawBefore + amount
      )
      // Set a max withdraw on 3rd party pool
      const maxWithdraw = ethers.parseUnits('0.1', 18)
      await thirdPartyPool.setMaxWithdraw(maxWithdraw)
      expect(await relayPool.maxWithdraw(userAddress)).to.be.equal(maxWithdraw)
    })
  })

  describe('maxMint', () => {
    after(async () => {
      await thirdPartyPool.setMaxDeposit(ethers.MaxUint256)
    })

    it('should return the maximum amount of tokens that we can deposited in the yield pool', async () => {
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()
      const maxDeposit = await relayPool.maxDeposit(userAddress)
      const maxMint = await relayPool.maxMint(userAddress)
      expect(maxMint).to.be.equal(await relayPool.convertToShares(maxDeposit))
    })
  })

  describe('maxRedeem', () => {
    it('should return the maximum amount of tokens that we can be redeemed in the yield pool based on the maximum amount that can be withdrawn', async () => {
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()

      const amount = ethers.parseUnits('1.4', 18)
      const relayPoolAddress = await relayPool.getAddress()
      await myToken.connect(user).mint(amount)
      await myToken.connect(user).approve(relayPoolAddress, amount)
      await relayPool.connect(user).deposit(amount, userAddress)

      const maxWithdraw = await relayPool.maxWithdraw(userAddress)
      const maxRedeem = await relayPool.maxRedeem(userAddress)
      expect(maxRedeem).to.be.equal(
        await relayPool.convertToShares(maxWithdraw + 1n) // for some reason we need to round!
      )
    })
  })
})
