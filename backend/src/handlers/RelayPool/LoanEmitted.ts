/*
  Handles the LoanEmitted event for the RelayPool.
  This event is intended only to update the loanEmittedTxHash field in an existing
  bridge_transaction record. It is expected that a prior event (e.g. a bridge initiation)
  created a complete record.

  Additionally, we update the RelayPool record with the fees accumulated.
  The fee is computed as (amount * bridgeFee) / 10000.
  If the corresponding poolOrigin record is found, its bridgeFee is used to calculate the fee.
  If not found, a warning is logged.
*/
import { Context, Event } from 'ponder:registry'
import { bridgeTransaction, relayPool, poolOrigin } from 'ponder:schema'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayPool:LoanEmitted'>
  context: Context<'RelayPool:LoanEmitted'>
}) {
  const { nonce, bridge, bridgeChainId, amount } = event.args

  // Update the corresponding bridgeTransaction record with loanEmittedTxHash
  try {
    await context.db
      .update(bridgeTransaction, {
        originChainId: bridgeChainId,
        originBridgeAddress: bridge,
        nonce,
      })
      .set({ loanEmittedTxHash: event.transaction.hash })
  } catch (error) {
    // If the record doesn't exist, warn and allow indexing to continue.
    console.log(
      `LoanEmitted event for (bridge: ${bridge}, nonce: ${nonce}, chain: ${bridgeChainId}) did not find an existing bridge_transaction record: ${error}`
    )
  }

  // Update the RelayPool's totalFees field with the fee amount calculated.
  try {
    // Retrieve the RelayPool record based on the contract address that emitted the event
    const poolRecord = await context.db.findOne(relayPool, {
      where: { contractAddress: event.address },
    })
    if (!poolRecord) {
      console.warn(`RelayPool record not found for address ${event.address}.`)
      return
    }

    // Retrieve the corresponding poolOrigin record to obtain the bridgeFee
    const originRecord = await context.db.findOne(poolOrigin, {
      where: {
        chainId: poolRecord.chainId,
        pool: event.address,
        originChainId: bridgeChainId,
        originBridge: bridge,
      },
    })
    if (!originRecord) {
      console.warn(
        `PoolOrigin record not found for pool ${event.address} with originChainId ${bridgeChainId} and originBridge ${bridge}.`
      )
      return
    }

    // Compute fee amount: fee = (amount * bridgeFee) / 10000
    const fee = (BigInt(amount) * BigInt(originRecord.bridgeFee)) / 10000n

    // Update totalFees pool's total fees
    const updatedTotalFees = BigInt(poolRecord.totalFees) + fee

    await context.db
      .update(relayPool, { contractAddress: event.address })
      .set({ totalFees: updatedTotalFees.toString() })
  } catch (error) {
    console.error(`Error updating RelayPool totalFees: ${error}`)
  }
}
