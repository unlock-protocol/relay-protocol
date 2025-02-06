import { Context, Event } from 'ponder:registry'
import { bridgeTransaction } from 'ponder:schema'
import { Mailbox } from '@relay-protocol/helpers/abis'
import networks from '@relay-protocol/networks'
import { decodeEventLog } from 'viem'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayBridge:BridgeInitiated'>
  context: Context<'RelayBridge:BridgeInitiated'>
}) {
  const networkConfig = networks[context.network.chainId]
  const { nonce, sender, recipient, asset, amount, poolChainId, pool } =
    event.args

  // Parse logs to find the DispatchId event and extract hyperlaneMessageId
  let hyperlaneMessageId
  const receipt = await context.client.getTransactionReceipt({
    hash: event.transaction.hash,
  })
  for (const log of receipt.logs) {
    if (
      log.address.toLowerCase() === networkConfig.hyperlaneMailbox.toLowerCase()
    ) {
      const event = decodeEventLog({
        abi: Mailbox,
        data: log.data,
        topics: log.topics,
      })

      if (event.eventName === 'DispatchId') {
        hyperlaneMessageId = event.args.messageId
      }
    }
  }

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
