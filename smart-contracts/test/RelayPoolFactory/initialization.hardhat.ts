import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import { MyToken, MyYieldPool, RelayPoolFactory } from '../../typechain-types'
import RelayPoolFactoryModule from '../../ignition/modules/RelayPoolFactoryModule'
import { getEvent } from '@relay-protocol/helpers'
import networks from '@relay-protocol/networks'

describe('RelayPoolFactory: deployment', () => {
  let relayPoolFactory: RelayPoolFactory
  let myToken: MyToken
  let timelockTemplate: any
  const hyperlaneMailbox = '0x1000000000000000000000000000000000000000'
  const weth = '0x2000000000000000000000000000000000000000'
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
    timelockTemplate = await TimelockController.deploy()
    await timelockTemplate.waitForDeployment()

    // Deploy the factory
    ;({ relayPoolFactory } = await ignition.deploy(RelayPoolFactoryModule, {
      parameters: {
        RelayPoolFactory: {
          hyperlaneMailbox,
          weth,
          timelock: await timelockTemplate.getAddress(),
        },
      },
      deploymentId: 'RelayPoolFactory',
    }))
  })

  it('should have deployed the factory', async () => {
    expect(await relayPoolFactory.hyperlaneMailbox()).to.equal(hyperlaneMailbox)
    expect(await relayPoolFactory.wrappedEth()).to.equal(weth)
    expect(await relayPoolFactory.timelockTemplate()).to.equal(
      await timelockTemplate.getAddress()
    )
  })

  it('should let user deploy a pool', async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    const initialDeposit = ethers.parseUnits('10', await myToken.decimals())

    await myToken.mint(initialDeposit)
    await myToken.approve(await relayPoolFactory.getAddress(), initialDeposit)

    const tx = await relayPoolFactory.deployPool(
      await myToken.getAddress(),
      'Test Vault',
      'RELAY',
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
    const pool = await ethers.getContractAt('RelayPool', poolAddress)
    expect(await pool.asset()).to.equal(await myToken.getAddress())
    expect(event.args.asset).to.equal(await myToken.getAddress())

    // Check that the pool is owned by the timelock
    expect(await pool.owner()).to.equal(event.args.timelock)
    const timelock = await ethers.getContractAt(
      'TimelockControllerUpgradeable',
      event.args.timelock
    )
    // No admin role
    expect(
      await timelock.hasRole(await timelock.DEFAULT_ADMIN_ROLE(), userAddress)
    ).to.be.equal(false)
    // But proposer, executor and canceller roles
    expect(
      await timelock.hasRole(await timelock.PROPOSER_ROLE(), userAddress)
    ).to.be.equal(true)
    expect(
      await timelock.hasRole(await timelock.EXECUTOR_ROLE(), userAddress)
    ).to.be.equal(true)
    expect(
      await timelock.hasRole(await timelock.CANCELLER_ROLE(), userAddress)
    ).to.be.equal(true)
  })
})
