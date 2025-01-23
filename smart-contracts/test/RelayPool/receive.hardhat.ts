import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import networks from '@relay-protocol/networks'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { MyWeth } from '../../typechain-types'

describe('RelayBridge: receive', () => {
  let myWeth: MyWeth

  before(async () => {
    myWeth = await ethers.deployContract('MyWeth')
  })

  it('should handle receiving eth and wrap it instantly if the pool is configured with WETH', async () => {
    const [user] = await ethers.getSigners()

    // deploy 3rd party pool
    const thirdPartyPool = await ethers.deployContract('MyYieldPool', [
      await myWeth.getAddress(),
      'My Yield Pool',
      'YIELD',
    ])
    const thirdPartyPoolAddress = await thirdPartyPool.getAddress()

    // deploy using ignition
    const parameters = {
      RelayPool: {
        hyperlaneMailbox: networks[1].hyperlaneMailbox,
        asset: await myWeth.getAddress(),
        name: `${await myWeth.name()} Relay Pool`,
        symbol: `${await myWeth.symbol()}-REL`,
        origins: [],
        thirdPartyPool: thirdPartyPoolAddress,
        weth: await myWeth.getAddress(),
        protocolFee: 0,
      },
    }
    const { relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
    })

    await user.sendTransaction({
      to: relayPool,
      value: ethers.parseEther('1'), // 1 ether
    })
    expect(await ethers.provider.getBalance(relayPool)).to.equal(0)
    expect(await myWeth.balanceOf(relayPool)).to.equal(ethers.parseEther('1'))
  })

  it('should fail to receive ETH if the pool was not configured with WETH', async () => {
    const [user] = await ethers.getSigners()

    const myToken = await ethers.deployContract('MyToken', [
      'My Token',
      'TOKEN',
    ])

    // deploy 3rd party pool
    const thirdPartyPool = await ethers.deployContract('MyYieldPool', [
      await myToken.getAddress(),
      'My Yield Pool',
      'YIELD',
    ])

    const thirdPartyPoolAddress = await thirdPartyPool.getAddress()
    const relayPool = await ethers.deployContract('RelayPool', [
      networks[1].hyperlaneMailbox,
      await myToken.getAddress(),
      `${await myToken.name()} Relay Pool`,
      `${await myToken.symbol()}-REL`,
      [],
      thirdPartyPoolAddress,
      myWeth,
      0,
    ])

    await expect(
      user.sendTransaction({
        to: relayPool,
        value: ethers.parseEther('1'), // 1 ether
      })
    ).to.be.revertedWithCustomError(relayPool, 'NotAWethPool')
    expect(await ethers.provider.getBalance(relayPool)).to.equal(0)
    expect(await myToken.balanceOf(relayPool)).to.equal(0)
  })
})
