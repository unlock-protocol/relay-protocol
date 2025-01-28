import { Context, Event } from 'ponder:registry'
import { bridgeVolume } from 'ponder:schema'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayBridge:BridgeInitiated'>
  context: Context<'RelayBridge:BridgeInitiated'>
}) {
  const { nonce, sender, recipient, asset, amount, poolChainId, pool } =
    event.args
  const blockNumber = event.block.number
  const transactionHash = event.transaction.hash
  const timestamp = event.block.timestamp

  // Generate unique ID using transaction hash and log index
  const eventId = `${transactionHash}-${event.log.logIndex}`

  // Record bridge volume
  await context.db.insert(bridgeVolume).values({
    id: eventId,
    chainId: context.network.chainId,
    bridge: event.log.address,
    sender,
    recipient,
    asset,
    amount,
    poolChainId,
    pool,
    nonce,
    timestamp,
    blockNumber,
    transactionHash,
  })
}
