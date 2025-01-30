import { task } from 'hardhat/config'

task('claim:zksync', 'Claim ARB from bridge')
  .addParam('txHash', 'Tx hash on origin chain')
  .addParam('origin', 'Origin chain id')
  .addParam('bridge', 'The proxy bridge contract on dest chain')
  .addParam('pool', 'The pool on dest chain')
  .setAction(
    async (
      { txHash, origin, pool: poolAddress, bridge },
      { ethers, zksyncEthers }
    ) => {
      const wallet = await zksyncEthers.getWallet(0)
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
