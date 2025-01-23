import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import { networks } from '@relay-protocol/networks'
import { IUSDC, ERC4626, RelayPool } from '../../typechain-types'
import { getStataToken } from '@relay-protocol/helpers'
import { mintUSDC } from '../utils/hardhat'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'

const {
  usdc: { token: USDC },
  weth,
} = networks[1]

describe('RelayBridge: use Aave yield pool (USDC)', () => {
  let relayPool: RelayPool
  let usdc: IUSDC
  let staticAaveUsdc: ERC4626
  let aavePoolAddress: string
  let userAddress: string

  before(async () => {
    const { chainId } = await ethers.provider.getNetwork()
    const [user] = await ethers.getSigners()
    userAddress = await user.getAddress()

    usdc = await ethers.getContractAt('IUSDC', USDC)
    await mintUSDC(USDC, userAddress, ethers.parseUnits('1000', 6))

    // get Aave pool static wrapper
    const staticAaveUsdcAddress = await getStataToken(USDC, 1n)
    staticAaveUsdc = await ethers.getContractAt(
      'ERC4626',
      staticAaveUsdcAddress
    )

    // the static token (sata) contract forwards assets to the main v3 pool
    const staticAavePoolGetter = await ethers.getContractAt(
      ['function aToken() view returns(address)'],
      await staticAaveUsdc.getAddress()
    )
    aavePoolAddress = await staticAavePoolGetter.aToken()

    // deploy the pool
    const parameters = {
      RelayPool: {
        hyperlaneMailbox: networks[1].hyperlaneMailbox,
        asset: await usdc.getAddress(),
        name: `${await usdc.name()} Relay Pool`,
        symbol: `${await usdc.symbol()}-REL`,
        origins: [],
        thirdPartyPool: await staticAaveUsdc.getAddress(),
        weth,
      },
    }
    ;({ relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
      deploymentId: `RelayPool-${parameters.RelayPool.symbol}-${chainId.toString()}`,
    }))
  })

  it('should deposit tokens into the Aave V3 yield pool when a user deposits funds', async () => {
    const [user] = await ethers.getSigners()
    const amount = ethers.parseUnits('1', 6)
    const userAddress = await user.getAddress()
    const relayPoolAddress = await relayPool.getAddress()
    const balanceThirdPartyPoolBefore = await usdc.balanceOf(aavePoolAddress)

    // Approved the Token to be spent by the RelayPool
    await (await usdc.connect(user).approve(relayPoolAddress, amount)).wait()

    // Deposit tokens to the RelayPool
    await relayPool.connect(user).deposit(amount, userAddress)

    // Check balances
    expect(await usdc.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await usdc.balanceOf(aavePoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount
    )
  })

  it('should deposit tokens into the Aave V3 yield pool when a user mints shares', async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    const relayPoolAddress = await relayPool.getAddress()
    const balanceThirdPartyPoolBefore = await usdc.balanceOf(aavePoolAddress)

    const newShares = ethers.parseUnits('0.4', 6)

    // Preview the mint to get the amount of tokens to be deposited
    const amount = await relayPool.previewMint(newShares)

    // Approve the Token to be spent by the RelayPool
    await usdc.connect(user).approve(await relayPool.getAddress(), amount)

    // Deposit tokens to the RelayPool
    await relayPool.connect(user).mint(newShares, userAddress)

    // Check balances
    expect(await usdc.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await usdc.balanceOf(aavePoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount
    )
  })

  it('should withdraw tokens from the Aave V3 yield pool when withdrawing liquidity', async () => {
    const [user] = await ethers.getSigners()
    const amount = ethers.parseUnits('1', 6)
    const userAddress = await user.getAddress()
    const relayPoolAddress = await relayPool.getAddress()

    const balanceThirdPartyPoolBefore = await usdc.balanceOf(aavePoolAddress)
    // Approved the Token to be spent by the RelayPool
    await (await usdc.connect(user).approve(relayPoolAddress, amount)).wait()

    // Deposit tokens to the RelayPool
    await relayPool.connect(user).deposit(amount, userAddress)

    // Check balances
    expect(await usdc.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await usdc.balanceOf(aavePoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount
    )

    // Withdraw tokens from the RelayPool
    const withdrawAmount = ethers.parseUnits('0.5', 6)
    await relayPool
      .connect(user)
      .withdraw(withdrawAmount, userAddress, userAddress)
    expect(await usdc.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await usdc.balanceOf(aavePoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount - withdrawAmount
    )
  })

  it('should withdraw tokens from the Aave V3 yield pool when redeeming shares', async () => {
    const [user] = await ethers.getSigners()
    const amount = ethers.parseUnits('1', 6)
    const userAddress = await user.getAddress()
    const relayPoolAddress = await relayPool.getAddress()

    const balanceThirdPartyPoolBefore = await usdc.balanceOf(aavePoolAddress)
    // Approved the Token to be spent by the RelayPool
    await (await usdc.connect(user).approve(relayPoolAddress, amount)).wait()

    // Deposit tokens to the RelayPool
    await relayPool.connect(user).deposit(amount, userAddress)

    // Check balances
    expect(await usdc.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await usdc.balanceOf(aavePoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount
    )

    // Withdraw tokens from the RelayPool
    const sharesToRedeem = await relayPool.balanceOf(userAddress)
    const amountToReceive = await relayPool.previewRedeem(sharesToRedeem)

    await relayPool
      .connect(user)
      .redeem(sharesToRedeem, userAddress, userAddress)

    expect(await usdc.balanceOf(relayPoolAddress)).to.equal(0)
    expect(await usdc.balanceOf(aavePoolAddress)).to.equal(
      balanceThirdPartyPoolBefore + amount - amountToReceive
    )
  })
})
