import { GET_ALL_TRANSACTIIONS_BY_TYPE } from '@relay-protocol/client'
import OPstack from './src/op'
import networks from '@relay-protocol/networks'
import { start, stop } from './src/runner'

const run = async () => {
  const { vaultService, database } = await start()

  const { bridgeTransactions } = await vaultService.query(
    GET_ALL_TRANSACTIIONS_BY_TYPE,
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
      if (
        destinationNetwork.bridges.op?.portalProxy &&
        bridgeTransaction.originChainId === 11155420 // For now it looks like only OPSepolia works!
      ) {
        const hash = await OPstack.submitProof(bridgeTransaction)
        // Update the bridge transaction status!
        await database.query(
          `
          UPDATE 
            "public"."bridge_transaction"
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
  await stop()
  console.log('Done!')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
