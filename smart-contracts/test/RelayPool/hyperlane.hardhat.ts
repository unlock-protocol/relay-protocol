import { expect } from 'chai'
import { AbiCoder } from 'ethers'
import { ethers, ignition } from 'hardhat'
import { getBalance, getEvent } from '@relay-protocol/helpers'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { MyToken, MyWeth, MyYieldPool, RelayPool } from '../../typechain-types'

const relayBridgeOptimism = '0x0000000000000000000000000000000000000010'
const oPStackNativeBridgeProxy = '0x0000000000000000000000000000000000000010'

export const encodeData = (
  nonce: bigint,
  recipient: string,
  amount: bigint
) => {
  const abiCoder = new AbiCoder()
  const types = ['uint256', 'address', 'uint256']
  return abiCoder.encode(types, [nonce, recipient, amount])
}

describe('ERC20 RelayBridge: when receiving a message from the Hyperlane Mailbox', () => {
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
        origins: [
          {
            chainId: 10,
            bridge: relayBridgeOptimism,
            maxDebt: ethers.parseEther('10'),
            proxyBridge: oPStackNativeBridgeProxy,
          },
        ],
        thirdPartyPool: await thirdPartyPool.getAddress(),
        weth: await myWeth.getAddress(),
        bridgeFee: 0,
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

  it('should ensure the handle function can only be called by the hyperlane mailbox', async () => {
    const [, anotherUser] = await ethers.getSigners()
    const anotherUserAddress = await anotherUser.getAddress()
    await expect(
      relayPool
        .connect(anotherUser)
        .handle(
          10,
          ethers.zeroPadValue(relayBridgeOptimism, 32),
          encodeData(1n, anotherUserAddress, ethers.parseUnits('1'))
        )
    )
      .to.be.revertedWithCustomError(relayPool, 'UnauthorizedCaller')
      .withArgs(anotherUserAddress)
  })

  it('should ensure the origin is authorized', async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()

    await expect(
      relayPool
        .connect(user)
        .handle(
          1337,
          ethers.zeroPadValue(relayBridgeOptimism, 32),
          encodeData(2n, userAddress, ethers.parseUnits('1'))
        )
    )
      .to.be.revertedWithCustomError(relayPool, 'UnauthorizedOrigin')
      .withArgs(1337, relayBridgeOptimism)

    await expect(
      relayPool
        .connect(user)
        .handle(
          10,
          ethers.zeroPadValue('0x000000000000000000000000000000000000dEaD', 32),
          encodeData(1n, userAddress, ethers.parseUnits('1'))
        )
    )
      .to.be.revertedWithCustomError(relayPool, 'UnauthorizedOrigin')
      .withArgs(10, '0x000000000000000000000000000000000000dEaD')
  })

  it('should make sure that a message cannot be processed twice', async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    const amount = ethers.parseUnits('1')
    const nonce = 3n
    await relayPool
      .connect(user)
      .handle(
        10,
        ethers.zeroPadValue(relayBridgeOptimism, 32),
        encodeData(nonce, userAddress, amount)
      )
    await expect(
      relayPool
        .connect(user)
        .handle(
          10,
          ethers.zeroPadValue(relayBridgeOptimism, 32),
          encodeData(nonce, userAddress, amount)
        )
    )
      .to.be.revertedWithCustomError(relayPool, 'MessageAlreadyProcessed')
      .withArgs(10, relayBridgeOptimism, nonce)
  })

  it('should ensure that an origin enforces its funding limit', async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()

    await expect(
      relayPool
        .connect(user)
        .handle(
          10,
          ethers.zeroPadValue(relayBridgeOptimism, 32),
          encodeData(4n, userAddress, ethers.parseUnits('10000'))
        )
    )
      .to.be.revertedWithCustomError(relayPool, 'TooMuchDebtFromOrigin')
      .withArgs(
        10,
        relayBridgeOptimism,
        ethers.parseEther('10'),
        4n,
        userAddress,
        ethers.parseUnits('10000')
      )
  })

  it('should keep track of the outstanding debt', async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    const amount = ethers.parseUnits('1')
    const originChainId = 10
    const originBridge = relayBridgeOptimism
    const debtBefore = await relayPool.outstandingDebt()
    const originSettingsBefore = await relayPool.authorizedOrigins(
      originChainId,
      originBridge
    )

    await relayPool
      .connect(user)
      .handle(
        originChainId,
        ethers.zeroPadValue(originBridge, 32),
        encodeData(5n, userAddress, amount)
      )

    expect(await relayPool.outstandingDebt()).to.equal(debtBefore + amount)
    const originSettingsAfter = await relayPool.authorizedOrigins(
      originChainId,
      originBridge
    )
    expect(originSettingsAfter[1]).to.equal(originSettingsBefore[1] + amount)
  })

  it('should transfer the assets from the pool to the recipient', async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    const amount = ethers.parseUnits('1')
    const userBalanceBefore = await myToken.balanceOf(userAddress)
    await relayPool
      .connect(user)
      .handle(
        10,
        ethers.zeroPadValue(relayBridgeOptimism, 32),
        encodeData(6n, userAddress, amount)
      )

    const userBalanceAfter = await myToken.balanceOf(userAddress)
    expect(userBalanceAfter).to.equal(userBalanceBefore + amount)
  })

  it('should maintain the value of shares', async () => {
    const [user, liquidityProvider] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    const liquidityProviderAddress = await liquidityProvider.getAddress()
    const poolAddress = await relayPool.getAddress()
    const bridgeAmount = ethers.parseUnits('1')

    // Mint tokens
    const liquidityAmount = ethers.parseUnits('100')
    await (
      await myToken.connect(liquidityProvider).mint(liquidityAmount)
    ).wait()

    await myToken
      .connect(liquidityProvider)
      .approve(poolAddress, liquidityAmount)
    // Add Liquidity to the pool
    await (
      await relayPool
        .connect(liquidityProvider)
        .deposit(liquidityAmount, liquidityProviderAddress)
    ).wait()

    const liquidityProviderSharesBefore = await relayPool.balanceOf(
      liquidityProviderAddress
    )
    expect(liquidityProviderSharesBefore).to.be.greaterThan(0)
    const assetsToRedeemBefore = await relayPool.previewRedeem(
      liquidityProviderSharesBefore
    )
    expect(assetsToRedeemBefore).to.be.greaterThan(0)

    await relayPool
      .connect(user)
      .handle(
        10,
        ethers.zeroPadValue(relayBridgeOptimism, 32),
        encodeData(7n, userAddress, bridgeAmount)
      )
    const liquidityProviderSharesAfter = await relayPool.balanceOf(
      liquidityProviderAddress
    )
    expect(liquidityProviderSharesAfter).to.equal(liquidityProviderSharesBefore)
    const assetsToRedeemAfter = await relayPool.previewRedeem(
      liquidityProviderSharesAfter
    )
    expect(assetsToRedeemAfter).to.equal(assetsToRedeemBefore)
  })

  it('should emit events LoanEmitted and OutstandingDebtChanged', async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    const amount = ethers.parseUnits('1')
    const receipt = await (
      await relayPool
        .connect(user)
        .handle(
          10,
          ethers.zeroPadValue(relayBridgeOptimism, 32),
          encodeData(8n, userAddress, amount)
        )
    ).wait()
    const { event: loanEmittedEvent } = await getEvent(
      receipt,
      'LoanEmitted',
      relayPool.interface
    )

    expect(loanEmittedEvent.args.nonce).to.equal(8n)
    expect(loanEmittedEvent.args.recipient).to.equal(userAddress)
    expect(loanEmittedEvent.args.asset).to.equal(await myToken.getAddress())
    expect(loanEmittedEvent.args.amount).to.equal(amount)
    expect(loanEmittedEvent.args.bridgeChainId).to.equal(10)
    expect(loanEmittedEvent.args.bridge).to.equal(relayBridgeOptimism)
    const { event: outstandingDebtChanged } = await getEvent(
      receipt,
      'OutstandingDebtChanged',
      relayPool.interface
    )
    expect(outstandingDebtChanged.args.newDebt).to.equal(
      outstandingDebtChanged.args.oldDebt + amount
    )
  })
})

describe('WETH RelayBridge: when receiving a message from the Hyperlane Mailbox', () => {
  let relayPool: RelayPool
  let thirdPartyPool: MyYieldPool
  let myWeth: MyWeth

  before(async () => {
    myWeth = await ethers.deployContract('MyWeth')
    await myWeth.deposit({ value: ethers.parseEther('3') })

    expect(await myWeth.totalSupply()).to.equal(ethers.parseEther('3'))

    // deploy 3rd party pool
    thirdPartyPool = await ethers.deployContract('MyYieldPool', [
      await myWeth.getAddress(),
      'My Yield Pool',
      'YIELD',
    ])
    // deploy the pool using ignition
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    const parameters = {
      RelayPool: {
        hyperlaneMailbox: userAddress, // using the user address as the mailbox so we can send transactions!
        asset: await myWeth.getAddress(),
        name: 'WETH RELAY POOL',
        symbol: 'WETH-REL',
        origins: [
          {
            chainId: 10,
            bridge: relayBridgeOptimism,
            maxDebt: ethers.parseEther('10'),
            proxyBridge: oPStackNativeBridgeProxy,
          },
        ],
        thirdPartyPool: await thirdPartyPool.getAddress(),
        weth: await myWeth.getAddress(),
        bridgeFee: 0,
        curator: userAddress,
      },
    }
    ;({ relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
    }))

    const liquidity = ethers.parseUnits('1', 18)
    await myWeth.connect(user).approve(await relayPool.getAddress(), liquidity)
    await relayPool.connect(user).deposit(liquidity, await user.getAddress())
  })

  it('should transfer the assets from the pool to the recipient as ETH', async () => {
    const [hyperlane, anotherUser] = await ethers.getSigners()
    const userAddress = await anotherUser.getAddress()
    const amount = ethers.parseUnits('1')
    const userBalanceBefore = await getBalance(userAddress, ethers.provider)
    const userWethBalanceBefore = await getBalance(
      userAddress,
      await myWeth.getAddress(),
      ethers.provider
    )
    await relayPool
      .connect(hyperlane)
      .handle(
        10,
        ethers.zeroPadValue(relayBridgeOptimism, 32),
        encodeData(9n, userAddress, amount)
      )

    const userBalanceAfter = await getBalance(userAddress, ethers.provider)
    const userWethBalanceAfter = await getBalance(
      userAddress,
      await myWeth.getAddress(),
      ethers.provider
    )

    expect(userBalanceAfter).to.equal(userBalanceBefore + amount)
    expect(userWethBalanceAfter).to.equal(userWethBalanceBefore)
  })
})
