import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { MyToken, MyWeth, MyYieldPool, RelayPool } from '../../typechain-types'

describe('RelayPool: asset transfers', () => {
  let relayPool: RelayPool
  let myToken: MyToken
  let thirdPartyPool: MyYieldPool
  let myWeth: MyWeth

  before(async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    myToken = await ethers.deployContract('MyToken', ['My Token', 'TOKEN'])
    expect(await myToken.totalSupply()).to.equal(1000000000000000000000000000n)

    myWeth = await ethers.deployContract('MyWeth')

    // deploy 3rd party pool
    thirdPartyPool = await ethers.deployContract('MyYieldPool', [
      await myToken.getAddress(),
      'My Yield Pool',
      'YIELD',
    ])
    // deploy the pool using ignition
    const parameters = {
      RelayPool: {
        hyperlaneMailbox: userAddress, // using the user address as the mailbox so we can send transactions!
        asset: await myToken.getAddress(),
        name: 'ERC20 RELAY POOL',
        symbol: 'ERC20-REL',
        origins: [],
        thirdPartyPool: await thirdPartyPool.getAddress(),
        weth: await myWeth.getAddress(),
        curator: userAddress,
      },
    }
    ;({ relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
    }))

    const liquidity = ethers.parseUnits('100', 18)
    await myToken.connect(user).mint(liquidity)
    await myToken.connect(user).approve(await relayPool.getAddress(), liquidity)
    await relayPool.connect(user).deposit(liquidity, await user.getAddress())
  })

  it('when assets are transfered to the pool directly', async () => {
    const relayPoolAddress = await relayPool.getAddress()
    const assetsBefore = await relayPool.totalAssets()
    expect(assetsBefore).to.be.greaterThan(0)
    const balanceBefore = await myToken.balanceOf(relayPoolAddress)
    expect(balanceBefore).to.be.equal(0) // All assets are in the yield pool!
    const amountToMint = assetsBefore // We double the assets in the pool
    await myToken.mintFor(amountToMint, relayPoolAddress)
    const balanceAfterTransfer = await myToken.balanceOf(relayPoolAddress)
    expect(balanceAfterTransfer).to.be.equal(amountToMint) // But these are not in the yeild pool yet!
    const assetsAfterTransfer = await relayPool.totalAssets()
    expect(assetsAfterTransfer).to.be.equal(assetsBefore) // The total assets should not account for assets not in the yield pool
  })

  describe('collectNonDepositedAssets', () => {
    before(async () => {
      await relayPool.collectNonDepositedAssets()
      const relayPoolAddress = await relayPool.getAddress()
      const amountToMint = ethers.parseUnits('1337', 18)
      await myToken.mintFor(amountToMint, relayPoolAddress)
      const balanceOfToken = await myToken.balanceOf(relayPoolAddress)
      expect(balanceOfToken).to.be.greaterThan(0)
    })

    it('should stream the fees for 7 days and increase the assets progressively', async () => {
      const relayPoolAddress = await relayPool.getAddress()

      const streamingPeriod = await relayPool.streamingPeriod()
      await ethers.provider.send('evm_increaseTime', [
        Number(streamingPeriod * 2n),
      ])
      await relayPool.updateStreamedAssets()

      const balanceOfTokenBefore = await myToken.balanceOf(relayPoolAddress)
      expect(balanceOfTokenBefore).to.be.greaterThan(0)

      const totalAssetsBefore = await relayPool.totalAssets()
      const sharesOfYieldPoolBefore =
        await thirdPartyPool.balanceOf(relayPoolAddress)
      const totalAssetsToStreamBefore = await relayPool.totalAssetsToStream()
      expect(totalAssetsToStreamBefore).to.be.equal(0)
      const lastAssetsCollectedAtBefore =
        await relayPool.lastAssetsCollectedAt()

      // Collect assets and start streaming them!
      await relayPool.collectNonDepositedAssets()

      // Balance should now be 0
      const balanceOfTokenAfter = await myToken.balanceOf(relayPoolAddress)
      expect(balanceOfTokenAfter).to.be.equal(0)

      // We should have more shares in the yield pool
      expect(
        await thirdPartyPool.balanceOf(relayPoolAddress)
      ).to.be.greaterThan(sharesOfYieldPoolBefore)

      // We should have more assets to stream!
      expect(await relayPool.totalAssetsToStream()).to.be.equal(
        balanceOfTokenBefore
      )

      // And we have a new timestamp for assets streaming!
      expect(await relayPool.lastAssetsCollectedAt()).to.be.greaterThan(
        lastAssetsCollectedAtBefore
      )

      // Total assets should be the same, because we are streaming (more tests below on the progressive increase)
      const totalAssetsAfter = await relayPool.totalAssets()
      expect(totalAssetsAfter).to.be.equal(totalAssetsBefore)

      // Advance by 1/4 of streamingPeriod
      await ethers.provider.send('evm_increaseTime', [
        Number(streamingPeriod / 4n),
      ])
      // Mine a new block
      await ethers.provider.send('evm_mine')
      const totalAssetsAfterOneQuarter = await relayPool.totalAssets()
      expect(totalAssetsAfterOneQuarter).to.equal(
        totalAssetsAfter + balanceOfTokenBefore / 4n
      )

      // Advance by another quarter of the remaining time
      await ethers.provider.send('evm_increaseTime', [
        Number(streamingPeriod / 4n),
      ])
      // Mine a new block
      await ethers.provider.send('evm_mine')
      const totalAssetsAfterOneHalf = await relayPool.totalAssets()
      expect(totalAssetsAfterOneHalf).to.equal(
        totalAssetsAfter + balanceOfTokenBefore / 2n
      )

      // Advance by another quarter of the remaining time
      await ethers.provider.send('evm_increaseTime', [
        Number(streamingPeriod / 4n),
      ])
      // Mine a new block
      await ethers.provider.send('evm_mine')
      const totalAssetsAfterThreeQuarter = await relayPool.totalAssets()
      expect(totalAssetsAfterThreeQuarter).to.equal(
        totalAssetsAfter + (3n * balanceOfTokenBefore) / 4n
      )

      // Advance all the way to the end!
      await ethers.provider.send('evm_increaseTime', [
        Number(streamingPeriod / 4n),
      ])
      // Mine a new block
      await ethers.provider.send('evm_mine')
      const totalAssetsAfterStreaming = await relayPool.totalAssets()
      expect(totalAssetsAfterStreaming).to.equal(
        totalAssetsAfter + balanceOfTokenBefore
      )

      // Keep advancing time and make sure the assets remain the same
      await ethers.provider.send('evm_increaseTime', [
        Number(streamingPeriod / 4n),
      ])
      // Mine a new block
      await ethers.provider.send('evm_mine')
      const totalAssetsAfterMoreTime = await relayPool.totalAssets()
      expect(totalAssetsAfterMoreTime).to.equal(
        totalAssetsAfter + balanceOfTokenBefore
      )
    })
  })
})
