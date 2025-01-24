import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import networks from '@relay-protocol/networks'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { mintUSDC } from '../utils/hardhat'

import {
  MyToken,
  MyYieldPool,
  RelayPool,
  SwapAndDeposit,
} from '../../typechain-types'
import SwapAndDepositModule from '../../ignition/modules/SwapAndDepositModule'
import { getBalance } from '@relay-protocol/helpers'

const {
  usdc: { token: USDC },
  // weth: WETH,
  uniswapV3: { universalRouterAddress },
} = networks[1]

// const scenario = [USDC, WETH]

describe('Swap and Deposit', () => {
  let relayPool: RelayPool
  let myToken: MyToken
  let thirdPartyPool: MyYieldPool
  let swapper: SwapAndDeposit

  before(async () => {
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
        weth: ethers.ZeroAddress, // Not used in this test
      },
      SwapAndDeposit: {
        uniswapUniversalRouter: universalRouterAddress,
      },
    }
    ;({ relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
    }))
    ;({ swapper } = await ignition.deploy(SwapAndDepositModule, {
      parameters,
    }))
  })

  describe('USDC', () => {
    const amount = ethers.parseUnits('100', 6)

    it('should swap any ERC20 token and deposit it directly into the pool', async () => {
      const relayPoolAddress = await relayPool.getAddress()
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()

      // get some USDC
      await mintUSDC(USDC, userAddress, amount)
      const usdc = await ethers.getContractAt('IUSDC', USDC)

      // send some USDC to the pool
      await usdc.connect(user).transfer(relayPoolAddress, amount)
      const balanceBefore = await getBalance(
        relayPoolAddress,
        USDC,
        ethers.provider
      )
      expect(balanceBefore).to.be.equal(amount)

      // set SwapDeposit contract
      await relayPool.setSwapDeposit(await swapper.getAddress())
      expect(await swapper.getAddress()).to.equal(
        await relayPool.swapDepositAddress()
      )

      // swap that amount
      await relayPool.swapAndDeposit(
        USDC,
        3000, // uniswapPoolFee
        amount
      )

      // no usdc left
      expect(
        await getBalance(relayPoolAddress, USDC, ethers.provider)
      ).to.be.equal(0)
    })
  })
})
