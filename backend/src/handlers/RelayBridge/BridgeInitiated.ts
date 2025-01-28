import { Context, Event } from 'ponder:registry'
import { bridgeTransaction } from 'ponder:schema'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayBridge:BridgeInitiated'>
  context: Context<'RelayBridge:BridgeInitiated'>
}) {
  const { nonce, sender, recipient, asset, amount, poolChainId, pool } =
    event.args

  // Record bridge initiation
  await context.db.insert(bridgeTransaction).values({
    // Bridge identification
    originBridgeAddress: event.log.address,
    nonce,

    // Chain information
    originChainId: context.network.chainId,
    destinationPoolAddress: pool,
    destinationPoolChainId: poolChainId,

    // Transaction participants
    originSender: sender,
    destinationRecipient: recipient,

    // Asset details
    asset,
    amount,

    // Bridge status tracking
    hyperlaneMsgId: null as any,
    hyperlaneMsgTimestamp: null,

    nativeBridgeStatus: 'INITIATED',
    nativeBridgeProofTimestamp: null,
    nativeBridgeFinalizedTimestamp: null,

    // Instant loan tracking
    loanEmittedTimestamp: null,
    loanEmittedTxHash: null as any,

    // Origin transaction details
    originBlockNumber: event.block.number,
    originTimestamp: event.block.timestamp,
    originTxHash: event.transaction.hash,
  })
}
