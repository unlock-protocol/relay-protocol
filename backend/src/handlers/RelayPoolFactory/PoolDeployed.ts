import { Context, Event } from 'ponder:registry'
import { relayPool, yieldPool } from 'ponder:schema'
import { erc20Abi } from 'viem'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayPoolFactory:PoolDeployed'>
  context: Context<'RelayPoolFactory:PoolDeployed'>
}) {
  const { pool, asset, creator, thirdPartyPool, origins } = event.args

  // Fetch the name of the third-party yield pool,
  // and the name and symbol of the relay pool.
  const [yieldName, poolName, poolSymbol] = await Promise.all([
    context.client.readContract({
      abi: erc20Abi,
      address: thirdPartyPool,
      functionName: 'name',
    }),
    context.client.readContract({
      abi: erc20Abi,
      address: pool,
      functionName: 'name',
    }),
    context.client.readContract({
      abi: erc20Abi,
      address: pool,
      functionName: 'symbol',
    }),
  ])

  // Upsert yield pool using only its name.
  await context.db
    .insert(yieldPool)
    .values({
      contractAddress: thirdPartyPool as `0x${string}`,
      asset: asset as `0x${string}`,
      name: yieldName,
      lastUpdated: BigInt(event.block.timestamp),
    })
    .onConflictDoUpdate({
      name: yieldName,
      lastUpdated: BigInt(event.block.timestamp),
    })

  // Create relay pool with its own name and symbol fetched from the relay pool contract.
  await context.db.insert(relayPool).values({
    contractAddress: pool as `0x${string}`,
    asset: asset as `0x${string}`,
    curator: creator as `0x${string}`,
    yieldPool: thirdPartyPool as `0x${string}`,
    outstandingDebt: BigInt(0),
    totalAssets: BigInt(0),
    totalShares: BigInt(0),
    totalFees: BigInt(0),
    chainId: context.network.chainId,
    createdAt: BigInt(new Date().getTime()),
    createdAtBlock: event.block.number,
    name: poolName,
    symbol: poolSymbol,
  })
}
