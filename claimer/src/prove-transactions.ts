import {
  GET_ALL_BRIDGE_TRANSACTIONS_BY_TYPE,
  RelayVaultService,
} from '@relay-protocol/client'
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
  console.log('using schema', schema)

  const { bridgeTransactions } = await vaultService.query(
    GET_ALL_BRIDGE_TRANSACTIONS_BY_TYPE,
    {
      nativeBridgeStatus: 'INITIATED',
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
