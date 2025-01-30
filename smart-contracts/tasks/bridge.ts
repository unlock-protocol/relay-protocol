import { task } from 'hardhat/config'

task('bridge:send', 'Send tokens to a pool across a relay bridge')
  .addParam('bridge', 'The Relay Bridge contract address')
  .addParam('pool', 'Pool address on destination chain')
  .addParam('amount', 'the amount of tokens to send')
  .addOptionalParam('recipient', 'The recipient of the funds (default to self)')
  .addOptionalParam(
    'destChain',
    'the id of destination chain (default to eth mainnet)'
  )
  .setAction(
    async (
      {
        bridge: bridgeAddress,
        pool: poolAddress,
        amount,
        recipient,
        destChain = 11155111,
        // asset: assetAddress,
      },
      { ethers }
    ) => {
      const { getBalance, checkAllowance } = await import('../lib/utils')

      const bridge = await ethers.getContractAt('RelayBridge', bridgeAddress)
      const assetAddress = await bridge.asset()
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()

      // parse default values
      if (!recipient) recipient = userAddress

      // check balance
      const balance = await getBalance(userAddress, assetAddress)
      if (balance < amount) {
        throw Error(
          `Insufficient balance (actual: ${balance}, expected: ${amount})`
        )
      }

      // check allowance
      if (assetAddress != ethers.ZeroAddress) {
        const asset = await ethers.getContractAt('MyToken', assetAddress)
        await checkAllowance(asset, bridgeAddress, amount)
      }

      // TODO: estimate fee correctly
      const hyperlaneFee = ethers.parseEther('0.003')
      const value =
        assetAddress === ethers.ZeroAddress
          ? BigInt(amount) + hyperlaneFee
          : hyperlaneFee

      const tx = await bridge.bridge(
        amount,
        recipient,
        destChain, // chain
        poolAddress,
        {
          value,
          gasLimit: 25000000,
        }
      )

      // TODO: parse tx results
      const receipt = await tx.wait()
      // console.log(receipt?.logs)
      console.log(`tx sent. ${tx.hash}`)
    }
  )

task('bridge:send-proxy', 'Send tokens across a proxy bridge (test purposes)')
  // .addParam('asset', 'The ERC20 asset to deposit')
  .addParam('bridge', 'The bridge contract address')
  .addParam('amount', 'the amount of tokens to send')
  .addOptionalParam(
    'destChain',
    'the id of destination chain (default to eth mainnet)'
  )
  .addOptionalParam('asset', 'the asset to send (default to native)')
  .addOptionalParam('recipient', 'The recipient of the funds (default to self)')
  .setAction(
    async (
      {
        bridge: bridgeAddress,
        amount,
        destChain,
        asset: assetAddress,
        recipient,
      },
      { ethers }
    ) => {
      const { getBalance, checkAllowance } = await import('../lib/utils')

      const bridge = await ethers.getContractAt('BridgeProxy', bridgeAddress)
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()

      // parse default values
      if (!assetAddress) assetAddress = ethers.ZeroAddress
      if (!recipient) recipient = userAddress
      if (!destChain) destChain = 1

      // check balance
      const balance = await getBalance(
        userAddress,
        assetAddress,
        ethers.provider
      )
      if (balance < amount) {
        throw Error(
          `Insufficient balance (actual: ${balance}, expected: ${amount})`
        )
      }

      // check allowance
      if (assetAddress != ethers.ZeroAddress) {
        const asset = await ethers.getContractAt('MyToken', assetAddress)
        await checkAllowance(asset, bridgeAddress, amount)
      }

      // send tx
      const tx = await bridge.bridge(
        userAddress, // sender
        destChain, // destinationChainId,
        recipient, // recipient
        assetAddress, // asset
        amount, // amount
        '0x', // data
        {
          value: assetAddress === ethers.ZeroAddress ? amount : 0,
        }
      )

      // parse tx results
      const receipt = await tx.wait()
      console.log(receipt?.logs)
      // TODO: check for AssetsDepositedIntoYieldPool or similar
      // const event = await getEvent(receipt, 'MessagePassed')
    }
  )
