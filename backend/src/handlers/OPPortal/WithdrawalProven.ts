import { eq } from 'ponder'
import { Context, Event } from 'ponder:registry'
import { bridgeTransaction } from 'ponder:schema'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayBridge:WithdrawalProven'>
  context: Context<'RelayBridge:WithdrawalProven'>
}) {
  await context.db.sql
    .update(bridgeTransaction)
    .set({
      nativeBridgeStatus: 'PROVEN',
      nativeBridgeProofTxHash: event.transaction.hash,
    })
    .where(eq(bridgeTransaction.originTxHash, event.args.withdrawalHash))
}
