import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import networks from '@relay-protocol/networks'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { mintUSDC, stealERC20 } from '../utils/hardhat'

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

const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const MORPHO = '0x58D97B57BB95320F9a05dC918Aef65434969c2B2'

describe('Swap and Deposit', () => {
  let relayPool: RelayPool
  let myToken: MyToken
  let thirdPartyPool: MyYieldPool
  let swapper: SwapAndDeposit

  before(async () => {
    myToken = await ethers.getContractAt('MyToken', DAI)
    expect(await myToken.symbol()).to.equal('DAI')

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

  it('has correct constructor params', async () => {
    expect(await swapper.uniswapUniversalRouter()).to.equal(
      universalRouterAddress
    )
  })

  describe('swap MORPHO correctly', () => {
    const amount = ethers.parseUnits('100', 18)
    let relayPoolAddress: string

    before(async () => {
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()
      relayPoolAddress = await relayPool.getAddress()

      // get some USDC
      const morpho = await ethers.getContractAt('IUSDC', MORPHO)
      await stealERC20(
        MORPHO,
        '0x9D03bb2092270648d7480049d0E58d2FcF0E5123', // morpho whale
        userAddress,
        amount
      )
      // send some USDC to the pool
      await morpho.connect(user).transfer(relayPoolAddress, amount)
    })

    it('should swap MORPHO into DAI and transfer it directly into the pool balance', async () => {
      const balanceBefore = await getBalance(
        relayPoolAddress,
        MORPHO,
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
        MORPHO,
        3000, // uniswapPoolFee
        amount
      )

      // no usdc left
      expect(
        await getBalance(relayPoolAddress, MORPHO, ethers.provider)
      ).to.be.equal(0)
    })
  })

  describe('swap USDC correctly', () => {
    const amount = ethers.parseUnits('100', 6)
    let relayPoolAddress: string

    before(async () => {
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()
      relayPoolAddress = await relayPool.getAddress()

      // get some USDC
      await mintUSDC(USDC, userAddress, amount)
      const usdc = await ethers.getContractAt('IUSDC', USDC)

      // send some USDC to the pool
      await usdc.connect(user).transfer(relayPoolAddress, amount)
    })

    it('should swap USDC into DAI and transfer it directly into the pool balance', async () => {
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
