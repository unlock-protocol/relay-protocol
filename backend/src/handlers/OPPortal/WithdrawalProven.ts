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
  const transactions = await context.db.sql
    .select()
    .from(bridgeTransaction)
    .where(eq(bridgeTransaction.originTxHash, event.args.withdrawalHash))
  if (transactions.length > 0) {
    await context.db
      .update(bridgeTransaction, { originTxHash: event.args.withdrawalHash })
      .set({
        nativeBridgeStatus: 'PROVEN',
        nativeBridgeProofTxHash: event.transaction.hash,
      })
  }
}
