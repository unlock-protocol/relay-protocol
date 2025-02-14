import {
  buildFinalizeWithdrawal,
  buildProveWithdrawal,
} from '@relay-protocol/helpers'
import { Portal2 } from '@relay-protocol/helpers/abis'
import * as ABIs from '@relay-protocol/abis'

import networks from '@relay-protocol/networks'
import { AbiCoder, ethers } from 'ethers'
import { getSignerForNetwork } from '../signer'

export const submitProof = async ({
  originChainId,
  originTxHash,
  destinationPoolChainId,
}) => {
  const destinationNetwork = networks[destinationPoolChainId.toString()]

  const signer = await getSignerForNetwork(destinationNetwork)
  const finalizeParams = await buildProveWithdrawal(
    originChainId,
    originTxHash,
    Number(destinationPoolChainId)
  )

  const portal = new ethers.Contract(
    destinationNetwork.bridges.op!.portalProxy!,
    Portal2,
    signer
  )
  const tx = await portal.proveWithdrawalTransaction(
    finalizeParams.transaction,
    finalizeParams.disputeGameIndex,
    finalizeParams.outputRootProof,
    finalizeParams.withdrawalProof
  )
  await tx.wait()
  return tx.hash
}

export const claimWithdrawal = async (bridgeTransaction) => {
  // console.log('OP Claim me!')
  // console.log(bridgeTransaction)
  const destinationNetwork = networks[bridgeTransaction.destinationPoolChainId]
  // Get the relaypool contract
  const signer = await getSignerForNetwork(destinationNetwork)
  const relayPool = new ethers.Contract(
    bridgeTransaction.destinationPoolAddress,
    ABIs.RelayPool,
    signer
  )

  const finalizeParams = await buildFinalizeWithdrawal(
    10,
    '0x8a8ed32ec52267ba5c5656dc68f459a8be3cdd23d8a1128ed321a2c6df2e8ee3'
  )
  const claimParams = new AbiCoder().encode(
    ['bytes', 'address'],
    [finalizeParams, submitter] // Hum, we need to the submitted address (it should be us though)
  )

  await relayPool.claim(bridgeTransaction.originTxHash)
  // Send `claim` transaction!
  // And that's it~
}

export default {
  submitProof,
  claimWithdrawal,
}
