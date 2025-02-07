/**
 * Vault Snapshot Handler
 *
 * This interval handler captures periodic snapshots of vault share prices at configured block intervals.
 * The snapshots track vault performance over time by recording share price history.
 *
 * For each vault (relay pool), it:
 * 1. Queries the current share price by calling convertToAssets(1e18) on the ERC4626 vault
 * 2. Creates a unique snapshot ID by combining the vault address and block number
 * 3. Records the snapshot with block metadata in the vaultsnapshot table
 *
 * The interval between snapshots is configured in ponder.config.ts via the VaultSnapshot block interval.
 * This provides a time series of share prices that can be used to analyze vault returns and performance.
 */

import { ponder } from 'ponder:registry'
import { vaultsnapshot, relayPool } from 'ponder:schema'

ponder.on('VaultSnapshot:block', async ({ event, context }) => {
  console.log(
    '[VaultSnapshot] Processing block ' +
      event.block.number +
      ' at timestamp ' +
      event.block.timestamp
  )

  const vaults = await context.db.sql.select().from(relayPool).execute()
  console.log('[VaultSnapshot] Found ' + vaults.length + ' vaults to process')

  for (const vault of vaults) {
    console.log(
      '[VaultSnapshot] Processing vault ' + vault.contractAddress + ':'
    )

    const sharePrice = await context.client.readContract({
      address: vault.contractAddress,
      abi: context.contracts.RelayPool.abi,
      functionName: 'convertToAssets',
      args: [BigInt('1000000000000000000')], // 1e18
    })

    console.log('  - Computed Share Price: ' + sharePrice.toString())

    // unique ID by combining vault address and block number
    const id = `${vault.contractAddress.toLowerCase()}-${event.block.number}`

    const snapshot = {
      id,
      vault: vault.contractAddress,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
      sharePrice: sharePrice.toString(),
    }

    await context.db.insert(vaultsnapshot).values(snapshot)
    console.log('  - Saved new vault snapshot to database')
  }

  console.log(
    '[VaultSnapshot] Completed processing block ' + event.block.number
  )
})
