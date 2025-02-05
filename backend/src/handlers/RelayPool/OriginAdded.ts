import { Context, Event } from 'ponder:registry'
import { poolOrigin } from 'ponder:schema'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayPool:OriginAdded'>
  context: Context<'RelayPool:OriginAdded'>
}) {
  console.log('OriginAdded event:', event)
  const { origin } = event.args
  const poolAddress = event.log.address

  // Insert the pool origin
  await context.db
    .insert(poolOrigin)
    .values({
      chainId: context.network.chainId,
      pool: poolAddress as `0x${string}`,
      proxyBridge: origin.proxyBridge as `0x${string}`,
      originChainId: origin.chainId,
      originBridge: origin.bridge as `0x${string}`,
      maxDebt: origin.maxDebt,
      curator: origin.curator,
      bridgeFee: origin.bridgeFee,
      coolDown: origin.coolDown,
    })
    .onConflictDoUpdate({
      maxDebt: origin.maxDebt,
      curator: origin.curator,
      bridgeFee: origin.bridgeFee,
      coolDown: origin.coolDown,
    })
}
