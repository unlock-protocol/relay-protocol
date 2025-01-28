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

import { Context } from 'ponder:registry'
import { erc20Abi, erc4626Abi } from 'viem'

export default async function ({
  block,
  context,
}: {
  block: any
  context: Context
}) {
  const { db } = context

  // Get all yield pools that need updating
  const yieldPools = await db.yieldPool.findMany()

  // Update each yield pool
  await Promise.all(
    yieldPools.map(async (yieldPool) => {
      try {
        // Read current state from chain
        const [totalAssets, totalShares, name] = await Promise.all([
          context.client.readContract({
            abi: erc4626Abi,
            address: yieldPool.contractAddress,
            functionName: 'totalAssets',
          }),
          context.client.readContract({
            abi: erc4626Abi,
            address: yieldPool.contractAddress,
            functionName: 'totalSupply',
          }),
          context.client.readContract({
            abi: erc20Abi,
            address: yieldPool.contractAddress,
            functionName: 'name',
          }),
        ])

        // Update yield pool data
        await db.yieldPool.update({
          where: { contractAddress: yieldPool.contractAddress },
          data: {
            totalAssets,
            totalShares,
            name,
            lastUpdated: BigInt(block.timestamp),
          },
        })
      } catch (error) {
        console.error(
          `Failed to update yield pool ${yieldPool.contractAddress}:`,
          error
        )
      }
    })
  )
}
