import { gql } from 'graphql-request'
import { RelayVaultService } from '@relay-protocol/client'
import networks from '@relay-protocol/networks'
import OPstack from './op'
import { L2NetworkConfig } from '@relay-protocol/types'

// Take all transactions that are initiated and attempts to prove them!
export const proveTransactions = async ({
  vaultService,
}: {
  vaultService: RelayVaultService
}) => {
  const { bridgeTransactions } = await vaultService.query(
    gql`
    query GetAllBridgeTransactionsToProve($nativeBridgeStatus: String!, $originChainIds: [Int], $originTimestamp: BigInt!) {
      bridgeTransactions(
          where: {
            nativeBridgeStatus: $nativeBridgeStatus
            originChainId_in: $originChainIds
            originTimestamp_gt: $originTimestamp
          }
        ) {
          items {
            originBridgeAddress
            nonce
            originChainId
            destinationPoolAddress
            destinationPoolChainId
            originSender
            destinationRecipient
            asset
            amount
            hyperlaneMessageId
            nativeBridgeStatus
            nativeBridgeProofTxHash
            nativeBridgeFinalizedTxHash
            loanEmittedTxHash
            originTimestamp
            originTxHash
          }
        }
      }
    `,
    {
      nativeBridgeStatus: 'INITIATED',
      originChainIds: Object.values(networks)
        .filter((n as L2NetworkConfig) => n.stack === 'op')
        .map((n) => n.chainId), // Only the OP chains!
      originTimestamp: 10, // 30 minutes required for OP proofs
    }
  )
  for (let i = 0; i < bridgeTransactions.items.length; i++) {
    try {
      const bridgeTransaction = bridgeTransactions.items[i]
      // TODO: use `proxyBridge` to identify which underlying bridge was actually used and
      // how to process it.
      // For now we use the chainId to identify the bridge (that won't work for USDC!)
      const destinationNetwork =
        networks[bridgeTransaction.destinationPoolChainId.toString()]
      if (destinationNetwork.bridges.op?.portalProxy) {
        await OPstack.submitProof(bridgeTransaction)
      }
    } catch (error) {
      console.error(error)
    }
  }
}
