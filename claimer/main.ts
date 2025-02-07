import {
  RelayVaultService,
  GET_ALL_TRANSACTIIONS_BY_TYPE,
} from '@relay-protocol/client'
import OPstack from './src/op'
import networks from '@relay-protocol/networks'

const run = async () => {
  const vaultService = new RelayVaultService(
    'https://relay-protocol-production.up.railway.app/' // TODO: add to config?
  )
  const { bridgeTransactions } = await vaultService.query(
    GET_ALL_TRANSACTIIONS_BY_TYPE,
    {
      nativeBridgeStatus: 'INITIATED',
    }
  )

  for (let i = 0; i < bridgeTransactions.items.length; i++) {
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
      await OPstack.submitProof(bridgeTransaction)
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
