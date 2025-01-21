import { Context, Event } from 'ponder:registry'
import { poolAction, relayPool, userBalance } from 'ponder:schema'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayPool:Deposit'>
  context: Context<'RelayPool:Deposit'>
}) {
  const { sender, assets, shares } = event.args
  const blockNumber = event.block.number
  const transactionHash = event.transaction.hash
  const timestamp = event.block.timestamp

  // Generate unique ID using transaction hash and log index
  const eventId = `${transactionHash}-${event.log.logIndex}`

  // Record pool action
  await context.db.insert(poolAction).values({
    id: eventId,
    type: 'DEPOSIT',
    user: sender,
    receiver: event.log.address,
    owner: event.log.address,
    relayPool: event.log.address,
    assets,
    shares,
    timestamp,
    blockNumber,
    transactionHash,
  })

  // Fetch current totalAssets and totalShares from contract
  const [totalAssets, totalShares] = await Promise.all([
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
  ])

  // Update relay pool with current values from contract
  await context.db
    .update(relayPool, { contractAddress: event.log.address })
    .set({
      totalAssets,
      totalShares,
    })

  // Update user balance - using insert with `onConflictDoUpdate` for atomic operations
  const balanceId = `${sender}-${event.log.address}` // wallet-pool format

  await context.db
    .insert(userBalance)
    .values({
      id: balanceId,
      wallet: sender,
      relayPool: event.log.address,
      balance: assets,
      totalDeposited: assets,
      totalWithdrawn: 0n,
      lastUpdated: timestamp,
    })
    .onConflictDoUpdate((row) => ({
      balance: row.balance + assets,
      totalDeposited: row.totalDeposited + assets,
      lastUpdated: timestamp,
    }))
}