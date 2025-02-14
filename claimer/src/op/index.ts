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
    finalizeParams.portalAddress,
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
  const destinationNetwork = networks[bridgeTransaction.destinationPoolChainId]
  // Get the relaypool contract
  const signer = await getSignerForNetwork(destinationNetwork)
  const relayPool = new ethers.Contract(
    bridgeTransaction.destinationPoolAddress,
    ABIs.RelayPool,
    signer
  )

  const finalizeParams = await buildFinalizeWithdrawal(
    bridgeTransaction.originChainId,
    bridgeTransaction.originTxHash
  )
  // Let's get the submitter by looking at the proof tx!

  console.log(bridgeTransaction.nativeBridgeProofTxHash)
  const receipt = await signer.provider!.getTransactionReceipt(
    bridgeTransaction.nativeBridgeProofTxHash
  )
  if (!receipt) {
    throw new Error('Proof tx not found')
  }
  const claimParams = new AbiCoder().encode(
    ['bytes', 'address'],
    [finalizeParams, receipt.from] // Hum, we need to the submitted address (it should be us though)
  )

  const tx = await relayPool.claim(
    bridgeTransaction.originChainId,
    bridgeTransaction.originBridgeAddress,
    claimParams
  )
  console.log('Claim tx:', tx.hash)
  // Send `claim` transaction!
  // And that's it~
}

export default {
  submitProof,
  claimWithdrawal,
}
