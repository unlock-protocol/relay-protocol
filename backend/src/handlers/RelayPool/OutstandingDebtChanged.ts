/**
 * Handler: OutstandingDebtChanged
 *
 * This handler listens for the `OutstandingDebtChanged` event emitted by the RelayPool contract.
 * On receiving the event, it updates the corresponding relay pool record in the database with the new outstanding debt.
 *
 * The event parameters include:
 *   - oldDebt: The previous outstanding debt value.
 *   - newDebt: The updated outstanding debt value.
 *
 * The pool is identified using the contract address found in the event log.
 *
 * This ensures that the backend state remains synchronized with the on-chain debt updates.
 */

import { Context, Event } from 'ponder:registry'
import { relayPool } from 'ponder:schema'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayPool:OutstandingDebtChanged'>
  context: Context<'RelayPool:OutstandingDebtChanged'>
}) {
  // Extract the new debt value from the event arguments.
  const { newDebt } = event.args

  // Retrieve the pool using the contract address from the event log.
  const poolAddress = event.log.address

  // Update the relay pool record with the new outstanding debt.
  await context.db.update(relayPool, { contractAddress: poolAddress }).set({
    outstandingDebt: newDebt,
  })
}
