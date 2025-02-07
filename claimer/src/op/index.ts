import { buildProveWithdrawal } from '@relay-protocol/helpers'
import { Portal2 } from '@relay-protocol/helpers/abis'

import networks from '@relay-protocol/networks'
import { ethers } from 'ethers'
import { getSignerForNetwork } from '../signer'

export const submitProof = async ({
  originChainId,
  originTxHash,
  destinationPoolChainId,
}) => {
  const destinationNetwork = networks[destinationPoolChainId]

  const signer = await getSignerForNetwork(destinationPoolChainId)

  const finalizeParams = await buildProveWithdrawal(
    originChainId,
    originTxHash,
    Number(destinationPoolChainId)
  )
  console.log({ finalizeParams })

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
  console.log(tx.hash)
  console.log('Ready to be claimed in 7 days!')
  // }
  // const portal = new ethers.Contract(
  //   networks[Number(chainId)].op.portalProxy,
  //   Portal2,
  //   signer
  // )
  // const tx = await portal.proveWithdrawalTransaction(
  //   finalizeParams.transaction,
  //   finalizeParams.disputeGameIndex,
  //   finalizeParams.outputRootProof,
  //   finalizeParams.withdrawalProof
  // )
  // console.log(tx.hash)
  // console.log('Ready to be claimed in 7 days!')

  // ok and let's now prove every transaction!
}

export default {
  submitProof,
}
