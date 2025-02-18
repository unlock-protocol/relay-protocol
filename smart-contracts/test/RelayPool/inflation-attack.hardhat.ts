import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import networks from '@relay-protocol/networks'
import {
  MyToken,
  MyYieldPool,
  RelayPool,
  RelayPoolFactory,
} from '../../typechain-types'
import RelayPoolFactoryModule from '../../ignition/modules/RelayPoolFactoryModule'
import { getEvent } from '@relay-protocol/helpers'

describe('RelayPool: inflation attack', () => {
  let relayPool: RelayPool
  let myToken: MyToken
  let thirdPartyPool: MyYieldPool
  let initialDeposit: bigint

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

    // Deposit in the third party pool
    const initialDepositThirdPartyPool = ethers.parseUnits(
      '100',
      await myToken.decimals()
    )
    await myToken
      .connect(user)
      .approve(await thirdPartyPool.getAddress(), initialDepositThirdPartyPool)
    await thirdPartyPool
      .connect(user)
      .deposit(initialDepositThirdPartyPool, userAddress)
    // Check that there are shares!
    expect(await myToken.totalSupply()).to.equal('1000000000000000000000000000')

    // Deploy an "empty" timelock for the Pool Factory
    const TimelockController = await ethers.getContractFactory(
      'TimelockControllerUpgradeable'
    )
    const timelockTemplate = await TimelockController.deploy()
    await timelockTemplate.waitForDeployment()

    // Deploy the factory
    const { relayPoolFactory } = await ignition.deploy(RelayPoolFactoryModule, {
      parameters: {
        RelayPoolFactory: {
          hyperlaneMailbox: networks[1].hyperlaneMailbox,
          weth: ethers.ZeroAddress,
          timelock: await timelockTemplate.getAddress(),
        },
      },
      deploymentId: 'RelayPoolFactory',
    })

    initialDeposit = ethers.parseUnits('100', await myToken.decimals())
    await myToken
      .connect(user)
      .approve(await relayPoolFactory.getAddress(), initialDeposit)

    const tx = await relayPoolFactory.deployPool(
      await myToken.getAddress(),
      `${await myToken.name()} Relay Pool`,
      `${await myToken.symbol()}-REL`,
      [],
      await thirdPartyPool.getAddress(),
      60 * 60 * 24 * 7,
      initialDeposit
    )

    const receipt = await tx.wait()
    const event = await getEvent(
      receipt!,
      'PoolDeployed',
      relayPoolFactory.interface
    )

    const poolAddress = event.args.pool
    relayPool = await ethers.getContractAt('RelayPool', poolAddress)

    expect(await relayPool.totalAssets()).to.equal(initialDeposit)
  })

  it('should not let user inflate the pool by using the ERC20', async () => {
    const [attacker, victim] = await ethers.getSigners()
    const attackerAddress = await attacker.getAddress()
    const thirdPartyPoolAddress = await thirdPartyPool.getAddress()

    const thirdPartyPoolBalanceBefore = await myToken.balanceOf(
      thirdPartyPoolAddress
    )

    // First, add a small amount of liquidity to the pool
    myToken.approve(await relayPool.getAddress(), 1)
    await relayPool.mint(1, attackerAddress)
    const sharesOfAttacker = await relayPool.balanceOf(attackerAddress)
    expect(sharesOfAttacker).to.equal(1)

    // Then send a LARGE amount of tokens to the third party pool
    const attackAmount = ethers.parseUnits('100', await myToken.decimals())
    myToken.connect(attacker).mint(attackAmount)
    myToken
      .connect(attacker)
      .approve(await thirdPartyPool.getAddress(), attackAmount)
    await thirdPartyPool
      .connect(attacker)
      .deposit(attackAmount, await relayPool.getAddress())
    expect(await myToken.balanceOf(thirdPartyPoolAddress)).to.equal(
      thirdPartyPoolBalanceBefore + 1n + attackAmount
    )

    // Now the victim adds some liquidity to the pool
    const victimAddress = await victim.getAddress()
    const victimDepositAmount = ethers.parseUnits(
      '1000',
      await myToken.decimals()
    )
    // mint tokens!
    myToken.connect(victim).mint(victimDepositAmount)

    // Deposit in the relay pool
    myToken
      .connect(victim)
      .approve(await relayPool.getAddress(), victimDepositAmount)
    await relayPool.connect(victim).deposit(victimDepositAmount, victimAddress)
    const sharesOfVictim = await relayPool.balanceOf(victimAddress)
    expect(sharesOfVictim).to.greaterThan(0)

    // Now the attacker withdraws their liquidity
    await relayPool
      .connect(attacker)
      .redeem(1, attackerAddress, attackerAddress)
    expect(await relayPool.balanceOf(attackerAddress)).to.equal(0)

    // And now the victim redeems all of their shares
    await relayPool
      .connect(victim)
      .redeem(sharesOfVictim, victimAddress, victimAddress)
    const balanceOfVictimAfter = await myToken.balanceOf(victimAddress)
    expect(balanceOfVictimAfter).to.equal(victimDepositAmount)
  })
})
