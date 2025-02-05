import { Context, Event } from 'ponder:registry'
import { bridgeTransaction } from 'ponder:schema'
import { getEvent } from '@relay-protocol/helpers'
import { Mailbox } from '@relay-protocol/helpers/abis'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayBridge:BridgeInitiated'>
  context: Context<'RelayBridge:BridgeInitiated'>
}) {
  const { nonce, sender, recipient, asset, amount, poolChainId, pool } =
    event.args

  // Ensure that the transaction object has a defined logs array
  const tx = event.transaction || {}
  tx.logs = tx.logs ?? []

  // Get Hyperlane dispatch event from the same transaction if logs exist.
  const dispatchEvent =
    tx.logs.length > 0 ? await getEvent(tx, 'Dispatch', Mailbox) : null
  const hyperlaneMessageId = dispatchEvent ? dispatchEvent.args[0] : null

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

    // Hyperlane
    hyperlaneMessageId,

    // Bridge status
    nativeBridgeStatus: 'INITIATED',
    nativeBridgeProofTxHash: null as any,
    nativeBridgeFinalizedTxHash: null as any,

    // Instant loan tracking
    loanEmittedTxHash: null as any,

    // Origin transaction details
    originTimestamp: event.block.timestamp,
    originTxHash: event.transaction.hash,
  })
}
