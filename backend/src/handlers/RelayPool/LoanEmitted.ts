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

  await context.db
    .update(bridgeTransaction, {
      originChainId: bridgeChainId,
      originBridgeAddress: bridge,
      nonce,
    })
    .set({
      loanEmittedTxHash: event.transaction.hash,
    })
}
