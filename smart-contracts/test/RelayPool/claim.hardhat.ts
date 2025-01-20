import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import { encodeData } from './hyperlane.hardhat'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import {
  MyOpStackPortal,
  MyWeth,
  MyYieldPool,
  RelayPool,
} from '../../typechain-types'

const relayBridgeOptimism = '0x0000000000000000000000000000000000000010'

const origins = []

describe('RelayBridge: claim', () => {
  let relayPool: RelayPool
  let myWeth: MyWeth
  let thirdPartyPool: MyYieldPool
  let userAddress: string
  let myOpStackPortal: MyOpStackPortal

  before(async () => {
    const [user] = await ethers.getSigners()
    userAddress = await user.getAddress()

    myWeth = await ethers.deployContract('MyWeth')

    // deploy 3rd party pool
    thirdPartyPool = await ethers.deployContract('MyYieldPool', [
      await myWeth.getAddress(),
      'My Yield Pool',
      'YIELD',
    ])
    const thirdPartyPoolAddress = await thirdPartyPool.getAddress()

    myOpStackPortal = await ethers.deployContract('MyOpStackPortal')
    // Fund the portal so it can simulate bridging of eth
    await user.sendTransaction({
      to: myOpStackPortal,
      value: ethers.parseEther('1'), // 1 ether
    })

    const oPStackNativeBridgeProxy = await ethers.deployContract(
      'OPStackNativeBridgeProxy',
      [myOpStackPortal]
    )

    origins.push({
      chainId: 10,
      bridge: relayBridgeOptimism,
      maxDebt: ethers.parseEther('10'),
      proxyBridge: await oPStackNativeBridgeProxy.getAddress(),
    })

    // deploy the pool using ignition
    const parameters = {
      RelayPool: {
        hyperlaneMailbox: userAddress, //mainnets[1].hyperlaneMailbox,
        asset: await myWeth.getAddress(),
        name: `${await myWeth.name()} Relay Pool`,
        symbol: `${await myWeth.symbol()}-REL`,
        origins,
        thirdPartyPool: thirdPartyPoolAddress,
        weth: await myWeth.getAddress(),
      },
    }
    ;({ relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
    }))

    // Fund the pool with some WETH
    await myWeth.deposit({ value: ethers.parseEther('3') })
    await myWeth.approve(await relayPool.getAddress(), ethers.parseEther('3'))
    await relayPool.deposit(ethers.parseEther('3'), userAddress)

    // Borrow from the pool
    await relayPool.handle(
      origins[0].chainId,
      ethers.zeroPadValue(origins[0].bridge, 32),
      encodeData(5n, userAddress, ethers.parseEther('1'))
    )
  })

  it('should fail to claim from an unauthorized chain', async () => {
    const originChain = 666
    const originBridge = ethers.ZeroAddress
    await expect(relayPool.claim(originChain, originBridge, '0x'))
      .to.be.revertedWithCustomError(relayPool, 'UnauthorizedOrigin')
      .withArgs(originChain, originBridge)
  })

  it('should fail to claim from an unauthorized contract', async () => {
    const originBridge = ethers.ZeroAddress
    await expect(relayPool.claim(origins[0].chainId, originBridge, '0x'))
      .to.be.revertedWithCustomError(relayPool, 'UnauthorizedOrigin')
      .withArgs(origins[0].chainId, originBridge)
  })

  it('should claim from the origin contract', async () => {
    const abiCoder = new ethers.AbiCoder()
    const relayPoolAddress = await relayPool.getAddress()
    const bridgedAmount = ethers.parseEther('0.2')
    const transaction = abiCoder.encode(
      ['uint256', 'address', 'address', 'uint256', 'uint256', 'bytes'],
      [
        123, // nonce,
        origins[0].bridge, // sender,
        relayPoolAddress, // target,
        bridgedAmount, // value,
        ethers.parseEther('0.0001'), // minGasLimit,
        '0x', // message
      ]
    )

    const myOpStackPortalBalance =
      await ethers.provider.getBalance(myOpStackPortal)

    const claimData = abiCoder.encode(
      ['bytes', 'address'],
      [transaction, relayPoolAddress]
    )

    await relayPool.claim(origins[0].chainId, origins[0].bridge, claimData)
    const myOpStackPortalBalanceAfter =
      await ethers.provider.getBalance(myOpStackPortal)

    expect(myOpStackPortalBalance - myOpStackPortalBalanceAfter).to.equal(
      bridgedAmount
    )
  })
  it('should fail if the delegate call fails')

  it('should update the outstanding debts', async () => {
    const abiCoder = new ethers.AbiCoder()
    const relayPoolAddress = await relayPool.getAddress()
    const bridgedAmount = ethers.parseEther('0.15')
    const transaction = abiCoder.encode(
      ['uint256', 'address', 'address', 'uint256', 'uint256', 'bytes'],
      [
        123, // nonce,
        origins[0].bridge, // sender,
        relayPoolAddress, // target,
        bridgedAmount, // value,
        ethers.parseEther('0.0001'), // minGasLimit,
        '0x', // message
      ]
    )

    const outstandingDebtBefore = await relayPool.outstandingDebt()
    const originSettingsBefore = await relayPool.authorizedOrigins(
      origins[0].chainId,
      origins[0].bridge
    )

    const claimData = abiCoder.encode(
      ['bytes', 'address'],
      [transaction, relayPoolAddress]
    )

    await relayPool.claim(origins[0].chainId, origins[0].bridge, claimData)
    const outstandingDebtAfter = await relayPool.outstandingDebt()
    const originSettingsAfter = await relayPool.authorizedOrigins(
      origins[0].chainId,
      origins[0].bridge
    )

    expect(outstandingDebtBefore - outstandingDebtAfter).to.equal(bridgedAmount)
    expect(
      originSettingsBefore.outstandingDebt - originSettingsAfter.outstandingDebt
    ).to.equal(bridgedAmount)
  })

  it('should desposit the funds in the 3rd party pool', async () => {
    const abiCoder = new ethers.AbiCoder()
    const relayPoolAddress = await relayPool.getAddress()
    const bridgedAmount = ethers.parseEther('0.033')
    const transaction = abiCoder.encode(
      ['uint256', 'address', 'address', 'uint256', 'uint256', 'bytes'],
      [
        123, // nonce,
        origins[0].bridge, // sender,
        relayPoolAddress, // target,
        bridgedAmount, // value,
        ethers.parseEther('0.0001'), // minGasLimit,
        '0x', // message
      ]
    )

    const poolAssetsBefore = await relayPool.totalAssets()
    const relayPoolBalanceBefore = await thirdPartyPool.balanceOf(
      await relayPool.getAddress()
    )

    const claimData = abiCoder.encode(
      ['bytes', 'address'],
      [transaction, relayPoolAddress]
    )

    await relayPool.claim(origins[0].chainId, origins[0].bridge, claimData)
    const poolAssetsAfter = await relayPool.totalAssets()
    const relayPoolBalanceAfter = await thirdPartyPool.balanceOf(
      await relayPool.getAddress()
    )

    // Assets remain unchanged (they were previously accounted for "in the bridge")
    expect(poolAssetsBefore - poolAssetsAfter).to.equal(0)

    // But the balance of the relay pool in the 3rd party pool should have increased
    expect(relayPoolBalanceAfter - relayPoolBalanceBefore).to.equal(
      bridgedAmount
    )
  })
})
