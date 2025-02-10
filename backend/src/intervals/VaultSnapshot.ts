/**
 * Vault Snapshot Handler
 *
 * This interval handler captures periodic snapshots of vault share prices at configured block intervals.
 * The snapshots track vault performance over time by recording share price history.
 *
 * For each vault (relay pool), it:
 * 1. Queries the current share price by calling convertToAssets(10^vaultDecimals) on the ERC4626 vault
 * 2. Creates a unique snapshot ID by combining the vault address and block number
 * 3. Records the snapshot with block metadata in the vaultSnapshot table
 *
 * The interval between snapshots is configured in ponder.config.ts via the VaultSnapshot block interval.
 * This provides a time series of share prices that can be used to analyze vault returns and performance.
 */

import { ponder } from 'ponder:registry'
import { vaultSnapshot, relayPool } from 'ponder:schema'

ponder.on('VaultSnapshot:block', async ({ event, context }) => {
  const vaults = await context.db.sql.select().from(relayPool).execute()

  for (const vault of vaults) {
    // retrieve the vault's decimals
    const vaultDecimals = await context.client.readContract({
      address: vault.contractAddress,
      abi: context.contracts.RelayPool.abi,
      functionName: 'decimals',
    })

    // calculate the share unit using the vault's decimals
    const shareUnit = BigInt(10) ** BigInt(vaultDecimals)

    // query the vault's current sharePrice from convertToAssets using the appropriate shareUnit
    const sharePrice = await context.client.readContract({
      address: vault.contractAddress,
      abi: context.contracts.RelayPool.abi,
      functionName: 'convertToAssets',
      args: [shareUnit],
    })

    // Create a unique snapshot ID by combining chainId, vault address and block number
    const id = `${vault.chainId}-${vault.contractAddress.toLowerCase()}-${event.block.number}`

    const snapshot = {
      id,
      vault: vault.contractAddress,
      chainId: vault.chainId,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
      sharePrice: sharePrice.toString(),
    }

    await context.db.insert(vaultSnapshot).values(snapshot)
  }
})
