import { task } from 'hardhat/config'
import { Wallet, Provider, types } from 'zksync-ethers'

task('claim:zksync', 'Claim ARB from bridge')
  .addParam('txHash', 'Tx hash on origin chain')
  .addParam('origin', 'Origin chain id')
  .addParam('bridge', 'The proxy bridge contract on dest chain')
  .addParam('pool', 'The pool on dest chain')
  .addOptionalParam('l1', 'The id of L1 chain')
  .setAction(
    async (
      { txHash, origin, pool: poolAddress, bridge, l1 = types.Network.Sepolia },
      { ethers }
    ) => {
      // get zksync wallet to fetch proof
      const zkProvider = Provider.getDefaultProvider(l1)
      const { DEPLOYER_PRIVATE_KEY } = process.env
      const wallet = new Wallet(
        DEPLOYER_PRIVATE_KEY!,
        zkProvider,
        ethers.provider
      )
      const params = await wallet.finalizeWithdrawalParams(txHash)
      console.log(params)

      const {
        l1BatchNumber,
        l2MessageIndex,
        l2TxNumberInBlock,
        message,
        proof,
      } = params

      // encode args to pass to pool
      const args = [
        origin,
        l1BatchNumber,
        l2MessageIndex,
        l2TxNumberInBlock,
        message,
        proof,
      ]

      const abiCoder = new ethers.AbiCoder()
      const bridgeParams = abiCoder.encode(
        ['uint256', 'uint256', 'uint256', 'uint16', 'bytes', 'bytes32[]'],
        args
      )

      const relayPool = await ethers.getContractAt('RelayPool', poolAddress)
      const tx = await relayPool.claim(origin, bridge, bridgeParams)
      console.log(tx)
    }
  )
