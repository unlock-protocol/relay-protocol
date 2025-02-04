import { task } from 'hardhat/config'
import { checkAllowance } from '@relay-protocol/helpers'

task('pool:deposit', 'Deposit ERC20 tokens in a relay pool')
  // .addParam('asset', 'The ERC20 asset to deposit')
  .addParam('pool', 'The relay pool address')
  .addParam('amount', 'the amount of tokens to deposit')
  .setAction(async ({ pool: poolAddress, amount }, { ethers }) => {
    const pool = await ethers.getContractAt('RelayPool', poolAddress)
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()

    // get underlying asset
    const assetAddress = await pool.asset()
    const asset = await ethers.getContractAt('MyToken', assetAddress)
    console.log(`${await pool.name()} - (asset: ${assetAddress})`)

    // check balance
    const balance = await asset.balanceOf(userAddress)
    if (balance < amount) {
      throw Error(
        `Insufficient balance (actual: ${balance}, expected: ${amount})`
      )
    }

    // check allowance
    await checkAllowance(asset, poolAddress, amount, userAddress)

    // make deposit
    const tx = await pool.deposit(amount, userAddress)

    // parse results
    const receipt = await tx.wait()
    console.log(receipt?.logs)
    // TODO: check for AssetsDepositedIntoYieldPool or similar
    // const event = await getEvent(receipt, 'MessagePassed')
  })
