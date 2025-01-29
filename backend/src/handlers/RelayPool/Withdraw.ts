import { Context, Event } from 'ponder:registry'
import { poolAction, relayPool, userBalance, yieldPool } from 'ponder:schema'
import { erc4626Abi } from 'viem'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayPool:Withdraw'>
  context: Context<'RelayPool:Withdraw'>
}) {
  const { sender, receiver, owner, assets, shares } = event.args
  const blockNumber = event.block.number
  const transactionHash = event.transaction.hash
  const timestamp = event.block.timestamp

  // Get the relay pool to find its yield pool
  const pool = await context.db.find(relayPool, {
    contractAddress: event.log.address,
  })

  if (!pool) {
    throw new Error(`Relay pool ${event.log.address} not found`)
  }

  // Fetch current state from both pools
  const [
    relayTotalAssets,
    relayTotalShares,
    yieldTotalAssets,
    yieldTotalShares,
  ] = await Promise.all([
    context.client.readContract({
      abi: context.contracts.RelayPool.abi,
      address: event.log.address,
      functionName: 'totalAssets',
    }),
    context.client.readContract({
      abi: context.contracts.RelayPool.abi,
      address: event.log.address,
      functionName: 'totalSupply',
    }),
    context.client.readContract({
      abi: erc4626Abi,
      address: pool.yieldPool,
      functionName: 'totalAssets',
    }),
    context.client.readContract({
      abi: erc4626Abi,
      address: pool.yieldPool,
      functionName: 'totalSupply',
    }),
  ])

  // Update both pools atomically
  await Promise.all([
    // Update relay pool
    context.db.update(relayPool, { contractAddress: event.log.address }).set({
      totalAssets: relayTotalAssets,
      totalShares: relayTotalShares,
    }),

    // Update yield pool
    context.db.update(yieldPool, { contractAddress: pool.yieldPool }).set({
      totalAssets: yieldTotalAssets,
      totalShares: yieldTotalShares,
      lastUpdated: BigInt(timestamp),
    }),

    // Record pool action
    context.db.insert(poolAction).values({
      id: `${transactionHash}-${event.log.logIndex}`,
      type: 'WITHDRAW',
      user: sender,
      receiver,
      owner,
      relayPool: event.log.address,
      assets,
      shares,
      timestamp,
      blockNumber,
      transactionHash,
    }),
  ])

  // Get user balance
  const balanceId = `${sender}-${event.log.address}` // wallet-pool format
  const user = await context.db.find(userBalance, { id: balanceId })

  if (!user) {
    throw new Error(
      `User ${sender} attempting to withdraw without existing balance record`
    )
  }

  // Update user balance
  await context.db.update(userBalance, { id: balanceId }).set({
    shareBalance: user.shareBalance - shares,
    totalWithdrawn: user.totalWithdrawn + assets,
    lastUpdated: timestamp,
  })
}
