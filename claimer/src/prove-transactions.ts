import { gql } from 'graphql-request'
import { RelayVaultService } from '@relay-protocol/client'
import { Client } from 'pg'
import networks from '@relay-protocol/networks'
import OPstack from './op'

// Take all transactions that are initiated and attempts to prove them!
export const proveTransactions = async ({
  vaultService,
  database,
  schema,
}: {
  vaultService: RelayVaultService
  database: Client
  schema: string
}) => {
  const { bridgeTransactions } = await vaultService.query(
    gql`
      query GetAllBridgeTransactionsToProve($nativeBridgeStatus: String!) {
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
      originChainId_in: [], // Only the OP chains!
      originTimestamp: new Date().getTime() - 1000 * 60 * 60 * 24 * 7,
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
        const hash = await OPstack.submitProof(bridgeTransaction)
        // Update the bridge transaction status!
        await database.query(
          `
          UPDATE 
            "${schema}"."bridge_transaction"
          SET 
            "native_bridge_status" = 'PROVEN', 
            "native_bridge_proof_tx_hash" = $1
          WHERE 
            "origin_tx_hash" = $2;`,
          [hash, bridgeTransaction.originTxHash]
        )
      }
    } catch (error) {
      console.error(error)
    }
  }
}
