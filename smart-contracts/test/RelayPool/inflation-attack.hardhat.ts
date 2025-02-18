import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import networks from '@relay-protocol/networks'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { MyToken, MyYieldPool, RelayPool } from '../../typechain-types'

describe('RelayPool: inflation attack', () => {
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

    // Deposit in the third party pool
    const initialDeposit = ethers.parseUnits('100', await myToken.decimals())
    await myToken
      .connect(user)
      .approve(await thirdPartyPool.getAddress(), initialDeposit)
    await thirdPartyPool.connect(user).deposit(initialDeposit, userAddress)
    // Check that there are shares!
    expect(await myToken.totalSupply()).to.equal('1000000000000000000000000000')

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
    // No assets yet!
    expect(await relayPool.totalAssets()).to.equal(0)
  })

  it('should not let user inflate the pool by using the ERC20', async () => {
    const [attacker, victim] = await ethers.getSigners()
    const attackerAddress = await attacker.getAddress()
    const thirdPartyPoolAddress = await thirdPartyPool.getAddress()
    const relayPoolAddress = await relayPool.getAddress()

    const thirdPartyPoolBalanceBefore = await myToken.balanceOf(
      thirdPartyPoolAddress
    )

    // First, add a small amount of liquidity to the pool
    myToken.approve(await relayPool.getAddress(), 1)
    await relayPool.mint(1, attackerAddress)
    const sharesOfAttacker = await relayPool.balanceOf(attackerAddress)
    expect(sharesOfAttacker).to.equal(1)
    // Check there are shares and assets
    expect(await relayPool.totalSupply()).to.equal(1)
    expect(await relayPool.totalAssets()).to.equal(1)
    expect(await myToken.balanceOf(thirdPartyPoolAddress)).to.equal(
      thirdPartyPoolBalanceBefore + 1n
    )
    expect(await myToken.balanceOf(relayPoolAddress)).to.equal(0)

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
