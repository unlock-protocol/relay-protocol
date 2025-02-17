/**
 * Handler: OutstandingDebtChanged
 *
 * This handler listens for the `OutstandingDebtChanged` event emitted by the RelayPool contract.
 * On receiving the event, it updates the corresponding relay pool record in the database with the new outstanding debt.
 * Additionally, it updates the per-origin outstanding debt values by:
 * 1. Fetching all poolOrigin records associated with this pool
 * 2. For each origin, querying the on-chain authorizedOrigins mapping
 * 3. Updating the poolOrigin record with the current outstanding debt for that origin
 *
 * The event parameters include:
 *   - newDebt: The updated outstanding debt value.
 *
 * The pool is identified using the contract address found in the event log.
 *
 * This ensures that the backend state remains synchronized with the on-chain debt updates,
 * both at the pool level and for individual origins.
 */

import { Context, Event } from 'ponder:registry'
import { relayPool, poolOrigin } from 'ponder:schema'
import { eq } from 'drizzle-orm'

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

  // Fetch all poolOrigin records associated with this pool using the SQL-based API.
  let origins
  origins = await context.db.sql
    .select()
    .from(poolOrigin)
    .where(eq(poolOrigin.pool, poolAddress))
    .execute()

  // For each origin record, we query the pool contract's authorizedOrigins mapping.
  // Note that the authorizedOrigins mapping is keyed by (originChainId, originBridge).
  for (const origin of origins) {
    // Read the origin's settings from the on-chain RelayPool contract.
    const originSettings = await context.client.readContract({
      address: poolAddress,
      abi: context.contracts.RelayPool.abi,
      functionName: 'authorizedOrigins',
      args: [origin.originChainId, origin.originBridge],
    })

    // Extract the outstandingDebt from the returned struct.
    // Sometimes named keys are not included in the returned struct,
    // so fall back to accessing via array index (2).
    const updatedOriginDebt =
      originSettings.outstandingDebt !== undefined
        ? originSettings.outstandingDebt
        : originSettings[2]

    // Update the poolOrigin record with this per-origin outstanding debt.
    await context.db
      .update(poolOrigin, {
        chainId: origin.chainId,
        pool: origin.pool,
        originChainId: origin.originChainId,
        originBridge: origin.originBridge,
      })
      .set({
        currentOutstandingDebt: updatedOriginDebt.toString(),
      })
  }
}
