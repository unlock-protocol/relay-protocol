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

  // Record bridge volume
  await context.db.insert(bridgeVolume).values({
    originBridge: event.log.address,
    nonce,
    chainId: context.network.chainId,
    sender,
    recipient,
    asset,
    amount,
    originChainId: poolChainId,
    pool,
    timestamp,
    blockNumber,
    transactionHash,
  })
}
