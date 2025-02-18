import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import networks from '@relay-protocol/networks'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import {
  MyToken,
  MyYieldPool,
  RelayPool,
  Timelock,
} from '../../typechain-types'
import { getEvent } from '@relay-protocol/helpers'
import { time } from '@nomicfoundation/hardhat-network-helpers'

describe('RelayPool: curator', () => {
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
    // deploy the pool using ignition
    const parameters = {
      RelayPool: {
        hyperlaneMailbox: networks[1].hyperlaneMailbox,
        asset: await myToken.getAddress(),
        name: `${await myToken.name()} Relay Pool`,
        symbol: `${await myToken.symbol()}-REL`,
        origins: [],
        thirdPartyPool: await thirdPartyPool.getAddress(),
        weth: ethers.ZeroAddress,
        curator: userAddress,
      },
    }
    ;({ relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
    }))
  })

  describe('updateYieldPool', () => {
    let betterYieldPool: MyYieldPool

    before(async () => {
      const [user] = await ethers.getSigners()

      // deposit some funds in the relay pool
      await myToken.approve(
        await relayPool.getAddress(),
        ethers.parseEther('3')
      )
      await relayPool.deposit(ethers.parseEther('3'), await user.getAddress())

      // deploy a new pool!
      betterYieldPool = await ethers.deployContract('MyYieldPool', [
        await myToken.getAddress(),
        'My Better Yield Pool',
        'BETTER',
      ])
    })

    it('should only be callable by the curator', async () => {
      const [, another] = await ethers.getSigners()
      await expect(
        relayPool
          .connect(another)
          .updateYieldPool(await thirdPartyPool.getAddress())
      )
        .to.be.revertedWithCustomError(relayPool, 'OwnableUnauthorizedAccount')
        .withArgs(await another.getAddress())
    })
    it('should pull all the funds from the previous pool and deposit in the new pool', async () => {
      const oldPoolAddress = await relayPool.yieldPool()
      const newPoolAddress = await betterYieldPool.getAddress()

      const oldPoolTokenBalanceBefore = await myToken.balanceOf(oldPoolAddress)
      expect(oldPoolTokenBalanceBefore).to.be.greaterThan(0)
      const newPoolTokenBalanceBefore = await myToken.balanceOf(newPoolAddress)
      expect(newPoolTokenBalanceBefore).to.be.equal(0)

      const receipt = await (
        await relayPool.updateYieldPool(newPoolAddress)
      ).wait()

      const oldPoolTokenBalanceAfter = await myToken.balanceOf(oldPoolAddress)
      expect(oldPoolTokenBalanceAfter).to.be.equal(0)
      const newPoolTokenBalanceAfter = await myToken.balanceOf(newPoolAddress)
      expect(newPoolTokenBalanceAfter).to.be.greaterThan(0)
      const { event } = await getEvent(
        receipt!,
        'YieldPoolChanged',
        relayPool.interface
      )
      expect(event.args.oldPool).to.equal(oldPoolAddress)
      expect(event.args.newPool).to.equal(newPoolAddress)
    })
  })

  describe('addOrigin', async () => {
    const newOrigin = {
      chainId: 10,
      bridge: ethers.Wallet.createRandom().address,
      maxDebt: ethers.parseEther('10'),
      proxyBridge: ethers.Wallet.createRandom().address,
      bridgeFee: 5,
      curator: ethers.Wallet.createRandom().address,
      coolDown: 0,
    }

    it('should only be callable by the curator', async () => {
      const [, another] = await ethers.getSigners()
      await expect(relayPool.connect(another).addOrigin(newOrigin))
        .to.be.revertedWithCustomError(relayPool, 'OwnableUnauthorizedAccount')
        .withArgs(await another.getAddress())
    })

    it('should add the origin to the list of approved origins and emit an event', async () => {
      const authorizedOriginBefore = await relayPool.authorizedOrigins(
        newOrigin.chainId,
        newOrigin.bridge
      )
      expect(authorizedOriginBefore.maxDebt).to.equal(0)
      expect(authorizedOriginBefore.outstandingDebt).to.equal(0)
      expect(authorizedOriginBefore.proxyBridge).to.equal(ethers.ZeroAddress)

      const receipt = await (await relayPool.addOrigin(newOrigin)).wait()
      const { event } = await getEvent(
        receipt!,
        'OriginAdded',
        relayPool.interface
      )
      expect(event.args.origin.maxDebt).to.equal(newOrigin.maxDebt)
      expect(event.args.origin.chainId).to.equal(newOrigin.chainId)
      expect(event.args.origin.bridge).to.equal(newOrigin.bridge)
      expect(event.args.origin.proxyBridge).to.equal(newOrigin.proxyBridge)

      const authorizedOriginAfter = await relayPool.authorizedOrigins(
        newOrigin.chainId,
        newOrigin.bridge
      )
      expect(authorizedOriginAfter.maxDebt).to.equal(newOrigin.maxDebt)
      expect(authorizedOriginAfter.outstandingDebt).to.equal(0)
      expect(authorizedOriginAfter.proxyBridge).to.equal(newOrigin.proxyBridge)
    })
  })

  describe('disableOrigin', () => {
    let originToRemove: {
      chainId: number
      bridge: string
      maxDebt: bigint
      proxyBridge: string
      bridgeFee: number
      curator: string
      coolDown: number
    }
    before(async () => {
      const [user] = await ethers.getSigners()

      originToRemove = {
        chainId: 10,
        bridge: ethers.Wallet.createRandom().address,
        maxDebt: ethers.parseEther('10'),
        proxyBridge: ethers.Wallet.createRandom().address,
        bridgeFee: 0,
        curator: await user.getAddress(),
        coolDown: 0,
      }

      // Let's first add it!
      await relayPool.addOrigin(originToRemove)
    })

    it("should only be callable by the origin's curator", async () => {
      const [, another] = await ethers.getSigners()
      await expect(
        relayPool
          .connect(another)
          .disableOrigin(originToRemove.chainId, originToRemove.bridge)
      )
        .to.be.revertedWithCustomError(relayPool, 'UnauthorizedCaller')
        .withArgs(await another.getAddress())
    })

    it('should change the maximum debt on the origin and emit an event', async () => {
      const authorizedOriginBefore = await relayPool.authorizedOrigins(
        originToRemove.chainId,
        originToRemove.bridge
      )
      expect(authorizedOriginBefore.maxDebt).to.not.equal(0n)
      const receipt = await (
        await relayPool.disableOrigin(
          originToRemove.chainId,
          originToRemove.bridge
        )
      ).wait()
      const authorizedOriginAfter = await relayPool.authorizedOrigins(
        originToRemove.chainId,
        originToRemove.bridge
      )
      expect(authorizedOriginAfter.maxDebt).to.equal(0n)

      const { event } = await getEvent(
        receipt!,
        'OriginDisabled',
        relayPool.interface
      )
      expect(event.args.chainId).to.equal(originToRemove.chainId)
      expect(event.args.bridge).to.equal(originToRemove.bridge)
      expect(event.args.maxDebt).to.equal(originToRemove.maxDebt)
      expect(event.args.outstandingDebt).to.equal(
        authorizedOriginBefore.outstandingDebt
      )
      expect(event.args.proxyBridge).to.equal(originToRemove.proxyBridge)
    })
  })
})
