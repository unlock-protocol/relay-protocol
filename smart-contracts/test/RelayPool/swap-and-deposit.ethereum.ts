import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import networks from '@relay-protocol/networks'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { mintUSDC, stealERC20 } from '../utils/hardhat'
import { reverts } from '../utils/errors'

import {
  MyToken,
  MyYieldPool,
  RelayPool,
  TokenSwap,
} from '../../typechain-types'
import TokenSwapModule from '../../ignition/modules/TokenSwapModule'
import { getBalance, getEvent } from '@relay-protocol/helpers'
import { Signer, ZeroAddress } from 'ethers'

const {
  assets: { weth: WETH, usdc: USDC },
  uniswapV3: { universalRouterAddress },
} = networks[1]

const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const MORPHO = '0x58D97B57BB95320F9a05dC918Aef65434969c2B2'

// pool is priced in DAI
const myTokenAddress = DAI

const tokenSwapBehavior = async (
  relayPool: RelayPool,
  tokenSwap: TokenSwap,
  token: string,
  amount: bigint,
  tokenPoolFee: number,
  assetPoolFee: number
) => {
  const balanceBefore = await getBalance(
    await relayPool.getAddress(),
    token,
    ethers.provider
  )
  expect(balanceBefore).to.be.equal(amount)

  // swap that amount
  const tx = await relayPool.swapAndDeposit(
    token,
    amount,
    tokenPoolFee,
    assetPoolFee
  )

  const receipt = await tx.wait()
  const { event: depositEvent } = await getEvent(
    receipt!,
    'AssetsDepositedIntoYieldPool',
    relayPool.interface
  )
  const { event: swapEvent } = await getEvent(
    receipt!,
    'TokenSwapped',
    tokenSwap.interface
  )
  expect(swapEvent.args.amount).to.be.equal(depositEvent.args.amountOut)

  // no weth left
  expect(
    await getBalance(await relayPool.getAddress(), token, ethers.provider)
  ).to.be.equal(0)
}

describe('RelayPool / Swap and Deposit', () => {
  let relayPool: RelayPool
  let myToken: MyToken
  let thirdPartyPool: MyYieldPool
  let tokenSwap: TokenSwap
  let curator: Signer
  let curatorAddress: string
  let user: Signer
  let userAddress: string
  let attacker: Signer

  before(async () => {
    ;[curator, user, attacker] = await ethers.getSigners()
    curatorAddress = await curator.getAddress()
    userAddress = await user.getAddress()
    myToken = await ethers.getContractAt('MyToken', myTokenAddress)

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
        weth: WETH,
        bridgeFee: 0,
        curator: curatorAddress,
      },
      TokenSwap: {
        uniswapUniversalRouter: universalRouterAddress,
      },
    }
    ;({ relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
    }))
    ;({ tokenSwap } = await ignition.deploy(TokenSwapModule, {
      parameters,
    }))

    // set TokenSwap contract
    await relayPool.connect(curator).setTokenSwap(await tokenSwap.getAddress())
    expect(await tokenSwap.getAddress()).to.equal(
      await relayPool.tokenSwapAddress()
    )
  })

  it('has correct constructor params', async () => {
    expect(await tokenSwap.uniswapUniversalRouter()).to.equal(
      universalRouterAddress
    )
  })

  it('can only be called by contract owner', async () => {
    await reverts(
      relayPool.connect(attacker).swapAndDeposit(ZeroAddress, 1000, 1000, 1000),
      `OwnableUnauthorizedAccount("${await attacker.getAddress()}")`
    )
  })

  describe('holding MORPHO (swapping using MORPHO > WETH > DAI)', () => {
    const amount = ethers.parseUnits('1', 18)
    let relayPoolAddress: string

    before(async () => {
      relayPoolAddress = await relayPool.getAddress()

      // get some USDC
      const morpho = await ethers.getContractAt('IERC20', MORPHO)
      await stealERC20(
        MORPHO,
        '0x9D03bb2092270648d7480049d0E58d2FcF0E5123', // morpho whale
        userAddress,
        amount
      )
      // send some USDC to the pool
      await morpho.connect(user).transfer(relayPoolAddress, amount)
    })

    it('should swap to pool asset and transfer it directly into the pool balance', async () => {
      await tokenSwapBehavior(
        relayPool,
        tokenSwap,
        MORPHO,
        amount,
        3000, // uniswapPoolFee morpho > WETH
        3000 // uniswapPoolFee WETH > DAI
      )
    })
  })

  describe('holding WETH (direct swap WETH > DAI )', () => {
    const amount = ethers.parseEther('3')
    let relayPoolAddress: string

    before(async () => {
      relayPoolAddress = await relayPool.getAddress()

      // get some WETH
      const weth = await ethers.getContractAt('IWETH', WETH)
      await weth.connect(user).deposit({ value: amount })
      await weth.connect(user).transfer(relayPoolAddress, amount)
    })

    it('should swap to pool asset and transfer it directly into the pool balance', async () => {
      await tokenSwapBehavior(
        relayPool,
        tokenSwap,
        WETH,
        amount,
        3000, // uniswapPoolFee
        0
      )
    })
  })

  describe('holding USDC (direct SWAP USDC > DAI)', () => {
    const amount = ethers.parseUnits('100', 6)
    let relayPoolAddress: string

    before(async () => {
      relayPoolAddress = await relayPool.getAddress()

      // get some USDC
      await mintUSDC(USDC, userAddress, amount)
      const usdc = await ethers.getContractAt('IUSDC', USDC)

      // send some USDC to the pool
      await usdc.connect(user).transfer(relayPoolAddress, amount)
    })

    it('should swap to pool asset and transfer it directly into the pool balance', async () => {
      await tokenSwapBehavior(
        relayPool,
        tokenSwap,
        USDC,
        amount,
        3000, // uniswapPoolFee
        0
      )
    })
  })
})
