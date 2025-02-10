/*
  Handles the LoanEmitted event for the RelayPool.
  This event is intended only to update the loanEmittedTxHash field in an existing
  bridge_transaction record. It is expected that a prior event (e.g. a bridge initiation)
  created a complete record.

  If no matching record is found, a warning is logged so that the indexing continues.
*/
import { Context, Event } from 'ponder:registry'
import { bridgeTransaction } from 'ponder:schema'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayPool:LoanEmitted'>
  context: Context<'RelayPool:LoanEmitted'>
}) {
  const { nonce, bridge, bridgeChainId } = event.args

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
}
