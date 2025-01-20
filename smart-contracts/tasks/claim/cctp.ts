/**
 * Script used to claim bridged USDCfrom CCTP bridge
 */
import { task } from 'hardhat/config'

task('claim:usdc', 'Claim USDC from bridge')
  .addParam('txHash', 'Tx hash on origin chain')
  .addParam('origin', 'Origin chain id')
  .addParam('pool', 'The pool on dest chain')
  .setAction(async ({ txHash, origin, pool }, { ethers }) => {
    const { getCCTPAttestation } = await import('../../lib/utils/cctp')
    const { attestation, status, messageBytes } = await getCCTPAttestation(
      txHash,
      origin
    )

    // receive attestation on dest server
    if (status === 'complete') {
      const relayPool = await ethers.getContractAt('RelayPool', pool)
      const abiCoder = relayPool.interface.getAbiCoder()
      const tx = await relayPool.claim(
        origin,
        ethers.zeroPadValue(pool, 32),
        abiCoder.encode(['bytes', 'bytes'], [messageBytes, attestation])
      )
      const receipt = await tx.wait()
      console.log(receipt)
    } else {
      console.log({ messageBytes, attestation, status })
      throw Error(`Attestation not completed: ${status}`)
    }
  })
