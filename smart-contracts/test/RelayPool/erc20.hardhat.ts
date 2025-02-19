import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import networks from '@relay-protocol/networks'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { MyToken, MyYieldPool, RelayPool } from '../../typechain-types'

describe('RelayBridge: when using an ERC20', () => {
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
        curator: userAddress,
      },
    }
    ;({ relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
    }))
  })

  it('should let user deposit funds and receive shares', async () => {
    const [user] = await ethers.getSigners()
    const amount = ethers.parseUnits('1', 18)

    const userAddress = await user.getAddress()
    const totalAssets = await relayPool.totalAssets()
    const totalSupply = await relayPool.totalSupply()
    const sharesBalance = await relayPool.balanceOf(userAddress)

    // Approved the Token to be spent by the RelayPool
    await (
      await myToken.connect(user).approve(await relayPool.getAddress(), amount)
    ).wait()

    // Preview the deposit
    const newShares = await relayPool.previewDeposit(amount)
    expect(newShares).to.equal(ethers.parseUnits('1', 18)) // 1 for 1

    // Deposit tokens to the RelayPool
    await relayPool.connect(user).deposit(amount, userAddress)
    // Total assets should have increased
    expect(await relayPool.totalAssets()).to.equal(totalAssets + amount)
    // Total supply should have increased
    expect(await relayPool.totalSupply()).to.equal(totalSupply + newShares)
    // Balance of shares for user should be correct
    expect(await relayPool.balanceOf(userAddress)).to.equal(
      sharesBalance + newShares
    )
  })

  it('should let user mint shares (by approving assets first)', async () => {
    const [user] = await ethers.getSigners()
    const newShares = ethers.parseUnits('1', 18)

    const userAddress = await user.getAddress()
    const totalAssets = await relayPool.totalAssets()
    const totalSupply = await relayPool.totalSupply()
    const sharesBalance = await relayPool.balanceOf(userAddress)

    // Preview the mint
    const amount = await relayPool.previewMint(newShares)
    expect(amount).to.equal(ethers.parseUnits('1', 18)) // 1 for 1!

    // Approved the Token to be spent by the RelayPool
    await (
      await myToken.connect(user).approve(await relayPool.getAddress(), amount)
    ).wait()

    // Mint shares
    await relayPool.connect(user).mint(amount, userAddress)
    // Total assets should have increased
    expect(await relayPool.totalAssets()).to.equal(totalAssets + amount)
    // Total supply should have increased
    expect(await relayPool.totalSupply()).to.equal(totalSupply + newShares)
    // Balance of shares for user should be correct
    expect(await relayPool.balanceOf(userAddress)).to.equal(
      sharesBalance + newShares
    )
  })

  it('should let user redeem shares they received after a deposit', async () => {
    const [, secondUser] = await ethers.getSigners()
    const amount = ethers.parseUnits('1', 18)
    const userAddress = await secondUser.getAddress()
    const totalAssets = await relayPool.totalAssets()
    const totalSupply = await relayPool.totalSupply()
    const sharesBalance = await relayPool.balanceOf(userAddress)

    // mint tokens to be deposited
    await myToken.connect(secondUser).mint(amount)

    // Approve the Token to be spent by the RelayPool
    await (
      await myToken
        .connect(secondUser)
        .approve(await relayPool.getAddress(), amount)
    ).wait()

    // Preview the deposit
    const newShares = await relayPool.previewDeposit(amount)
    expect(newShares).to.equal(ethers.parseUnits('1', 18)) // 1 for 1

    // Deposit tokens to the RelayPool
    await relayPool.connect(secondUser).deposit(amount, userAddress)

    // Total assets should have increased
    expect(await relayPool.totalAssets()).to.equal(totalAssets + amount)
    // Total supply should have increased
    expect(await relayPool.totalSupply()).to.equal(totalSupply + newShares)
    // Balance of shares for user should be correct
    expect(await relayPool.balanceOf(userAddress)).to.equal(
      sharesBalance + newShares
    )

    // Burn shares  half!)
    const sharesToBurn = ethers.parseUnits('0.5', 18)
    // Preview the redeem
    const assetsToReceive = await relayPool.previewRedeem(sharesToBurn)
    expect(assetsToReceive).to.equal(ethers.parseUnits('0.5', 18))
    await relayPool
      .connect(secondUser)
      .redeem(sharesToBurn, userAddress, userAddress)

    // Total assets should have decreased
    expect(await relayPool.totalAssets()).to.equal(
      totalAssets + amount - assetsToReceive
    )
    // Total supply should have decreased
    expect(await relayPool.totalSupply()).to.equal(
      totalSupply + newShares - sharesToBurn
    )
    // Balance of shares for user should be correct
    expect(await relayPool.balanceOf(userAddress)).to.equal(
      sharesBalance + newShares - sharesToBurn
    )
  })

  it('should let user redeem shares they minted', async () => {
    const [, secondUser] = await ethers.getSigners()
    const userAddress = await secondUser.getAddress()
    const totalAssets = await relayPool.totalAssets()
    const totalSupply = await relayPool.totalSupply()
    const sharesBalance = await relayPool.balanceOf(userAddress)

    const newShares = ethers.parseUnits('0.4', 18)

    // Preview the mint
    const amount = await relayPool.previewMint(newShares)
    expect(amount).to.equal(ethers.parseUnits('0.4', 18)) // 1 for 1

    // Approve the Token to be spent by the RelayPool
    await (
      await myToken
        .connect(secondUser)
        .approve(await relayPool.getAddress(), amount)
    ).wait()

    // mint tokens to be deposited
    await myToken.connect(secondUser).mint(amount)

    // Deposit tokens to the RelayPool
    await relayPool.connect(secondUser).mint(amount, userAddress)

    // Total assets should have increased
    expect(await relayPool.totalAssets()).to.equal(totalAssets + amount)
    // Total supply should have increased
    expect(await relayPool.totalSupply()).to.equal(totalSupply + newShares)
    // Balance of shares for user should be correct
    expect(await relayPool.balanceOf(userAddress)).to.equal(
      sharesBalance + newShares
    )

    // Burn shares (half of them!)
    const sharesToBurn = ethers.parseUnits('0.2', 18)
    // Preview the redeem
    const assetsToReceive = await relayPool.previewRedeem(sharesToBurn)
    expect(assetsToReceive).to.equal(ethers.parseUnits('0.2', 18))
    await relayPool
      .connect(secondUser)
      .redeem(sharesToBurn, userAddress, userAddress)

    // Total assets should have increased
    expect(await relayPool.totalAssets()).to.equal(
      totalAssets + amount - assetsToReceive
    )
    // Total supply should have increased
    expect(await relayPool.totalSupply()).to.equal(
      totalSupply + newShares - sharesToBurn
    )
    // Balance of shares for user should be correct
    expect(await relayPool.balanceOf(userAddress)).to.equal(
      sharesBalance + newShares - sharesToBurn
    )
  })

  it('should let user withdraw assets they deposited', async () => {
    const [, secondUser] = await ethers.getSigners()
    const amount = ethers.parseUnits('1', 18)
    const userAddress = await secondUser.getAddress()
    const totalAssets = await relayPool.totalAssets()
    const totalSupply = await relayPool.totalSupply()
    const sharesBalance = await relayPool.balanceOf(userAddress)

    // mint tokens to be deposited
    await myToken.connect(secondUser).mint(amount)

    // Approve the Token to be spent by the RelayPool
    await (
      await myToken
        .connect(secondUser)
        .approve(await relayPool.getAddress(), amount)
    ).wait()

    // Preview the deposit
    const newShares = await relayPool.previewDeposit(amount)
    expect(newShares).to.equal(ethers.parseUnits('1', 18)) // 1 for 1

    // Deposit tokens to the RelayPool
    await relayPool.connect(secondUser).deposit(amount, userAddress)

    // Total assets should have increased
    expect(await relayPool.totalAssets()).to.equal(totalAssets + amount)
    // Total supply should have increased
    expect(await relayPool.totalSupply()).to.equal(totalSupply + newShares)
    // Balance of shares for user should be correct
    expect(await relayPool.balanceOf(userAddress)).to.equal(
      sharesBalance + newShares
    )

    const assetsToReceive = ethers.parseUnits('0.5', 18)

    // Preview the withdrawal
    const sharesToBeBurnt = await relayPool.previewWithdraw(assetsToReceive)

    expect(sharesToBeBurnt).to.equal(ethers.parseUnits('0.5', 18))
    await relayPool
      .connect(secondUser)
      .withdraw(assetsToReceive, userAddress, userAddress)

    expect(await relayPool.totalAssets()).to.equal(
      totalAssets + amount - assetsToReceive
    )
    expect(await relayPool.totalSupply()).to.equal(
      totalSupply + newShares - sharesToBeBurnt
    )
    // Balance of shares for user should be correct
    expect(await relayPool.balanceOf(userAddress)).to.equal(
      sharesBalance + newShares - sharesToBeBurnt
    )
  })

  it('should let user withdraw assets they deposited thru a mint', async () => {
    const [, secondUser] = await ethers.getSigners()
    const userAddress = await secondUser.getAddress()
    const totalAssets = await relayPool.totalAssets()
    const totalSupply = await relayPool.totalSupply()
    const sharesBalance = await relayPool.balanceOf(userAddress)

    const newShares = ethers.parseUnits('0.4', 18)

    // Preview the mint
    const amount = await relayPool.previewMint(newShares)
    expect(amount).to.equal(ethers.parseUnits('0.4', 18)) // 1 for 1

    // Approve the Token to be spent by the RelayPool
    await (
      await myToken
        .connect(secondUser)
        .approve(await relayPool.getAddress(), amount)
    ).wait()

    // mint tokens to be deposited
    await myToken.connect(secondUser).mint(amount)

    // Deposit tokens to the RelayPool
    await relayPool.connect(secondUser).mint(newShares, userAddress)

    // Total assets should have increased
    expect(await relayPool.totalAssets()).to.equal(totalAssets + amount)
    // Total supply should have increased
    expect(await relayPool.totalSupply()).to.equal(totalSupply + newShares)
    // Balance of shares for user should be correct
    expect(await relayPool.balanceOf(userAddress)).to.equal(
      sharesBalance + newShares
    )

    const assetsToReceive = ethers.parseUnits('0.1', 18)

    // Preview the withdrawal
    const sharesToBeBurnt = await relayPool.previewWithdraw(assetsToReceive)

    expect(sharesToBeBurnt).to.equal(ethers.parseUnits('0.1', 18))
    await relayPool
      .connect(secondUser)
      .withdraw(assetsToReceive, userAddress, userAddress)

    expect(await relayPool.totalAssets()).to.equal(
      totalAssets + amount - assetsToReceive
    )
    expect(await relayPool.totalSupply()).to.equal(
      totalSupply + newShares - sharesToBeBurnt
    )
    // Balance of shares for user should be correct
    expect(await relayPool.balanceOf(userAddress)).to.equal(
      sharesBalance + newShares - sharesToBeBurnt
    )
  })
})
