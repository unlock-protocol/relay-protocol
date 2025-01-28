import { Context, Event } from 'ponder:registry'
import { relayBridge } from 'ponder:schema'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayBridgeFactory:BridgeDeployed'>
  context: Context<'RelayBridgeFactory:BridgeDeployed'>
}) {
  const { bridge, asset } = event.args

  console.log('GOT AN EVENT TO DEPLOY A BRIDGE!')

  await context.db.insert(relayBridge).values({
    chainId: context.network.chainId,
    contractAddress: bridge as `0x${string}`,
    asset: asset as `0x${string}`,
    transferNonce: BigInt(0),
    createdAt: BigInt(new Date().getTime()),
    createdAtBlock: event.block.number,
  })
}
