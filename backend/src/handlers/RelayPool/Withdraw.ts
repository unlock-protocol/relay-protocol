import { Context, Event } from 'ponder:registry'
import { poolAction, relayPool, userBalance } from 'ponder:schema'

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

  // Record pool action
  await context.db.insert(poolAction).values({
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
  await context.db.update(relayPool, { contractAddress: event.log.address }).set({
    totalAssets,
    totalShares,
  })

  // Get user balance
  const balanceId = `${sender}-${event.log.address}` // wallet-pool format
  const user = await context.db.find(userBalance, { id: balanceId })

  if (!user) {
    throw new Error(`User ${sender} attempting to withdraw without existing balance record`)
  }

  // Update user balance
  await context.db.update(userBalance, { id: balanceId }).set({
    balance: user.balance - assets,
    totalWithdrawn: user.totalWithdrawn + assets,
    lastUpdated: timestamp,
  })
}
