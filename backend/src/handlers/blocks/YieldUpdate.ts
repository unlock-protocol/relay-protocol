/**
 * Block handler that updates the state of all yield pools in the system.
 *
 * This handler runs on every new block and:
 * 1. Fetches all registered yield pools from the database
 * 2. For each pool, reads the current on-chain state (totalAssets, totalShares, name)
 * 3. Updates the database records with the latest state
 * 4. Handles errors gracefully for individual pool updates
 *
 * This ensures indexed data stays in sync with the actual on-chain state
 * and provides up-to-date information for the frontend.
 */

import { ponder } from 'ponder:registry'
import { erc20Abi, erc4626Abi } from 'viem'
import { yieldPool } from 'ponder:schema'

ponder.on('YieldUpdate:block', async ({ event, context }) => {
  const { db } = context

  // Get all yield pools from the database
  const pools = await db.sql.select().from(yieldPool).execute()

  if (!pools || pools.length === 0) {
    return
  }

  // Prepare batch updates
  const updates = await Promise.all(
    pools.map(async (pool) => {
      try {
        // Read current state from chain
        const [totalAssets, totalShares, name] = await Promise.all([
          context.client.readContract({
            abi: erc4626Abi,
            address: pool.contractAddress,
            functionName: 'totalAssets',
            blockNumber: event.block.number,
          }),
          context.client.readContract({
            abi: erc4626Abi,
            address: pool.contractAddress,
            functionName: 'totalSupply',
            blockNumber: event.block.number,
          }),
          context.client.readContract({
            abi: erc20Abi,
            address: pool.contractAddress,
            functionName: 'name',
            blockNumber: event.block.number,
          }),
        ])

        return {
          contractAddress: pool.contractAddress,
          asset: pool.asset,
          name,
          totalAssets,
          totalShares,
          lastUpdated: BigInt(event.block.timestamp),
        }
      } catch (error) {
        console.error(
          `Failed to update yield pool ${pool.contractAddress}:`,
          error
        )
        return null
      }
    })
  )

  // Filter out failed updates and update the database
  const validUpdates = updates.filter(
    (update): update is NonNullable<typeof update> => update !== null
  )

  if (validUpdates.length > 0) {
    await Promise.all(
      validUpdates.map((update) =>
        db.update(yieldPool, { contractAddress: update.contractAddress }).set({
          name: update.name,
          totalAssets: update.totalAssets,
          totalShares: update.totalShares,
          lastUpdated: update.lastUpdated,
        })
      )
    )
  }
})
