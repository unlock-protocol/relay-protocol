import {
  GET_ALL_BRIDGE_TRANSACTIONS_BY_TYPE,
  RelayVaultService,
} from '@relay-protocol/client'
import networks from '@relay-protocol/networks'
import OPstack from './op'

// Take all transactions that are initiated and attempts to prove them!
export const proveTransactions = async ({
  vaultService,
}: {
  vaultService: RelayVaultService
}) => {
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
        await OPstack.submitProof(bridgeTransaction)
      }
    } catch (error) {
      console.error(error)
    }
  }
}
