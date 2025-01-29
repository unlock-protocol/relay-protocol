import { NetworkConfig } from '@relay-protocol/types'

export const zksync: NetworkConfig = {
  l1ChainId: 1,
  chainId: 324,
  isTestnet: false,
  name: 'Zksync',
  slug: 'zksync',
  hyperlaneMailbox: '0xf44AdA86a1f765A938d404699B8070Dd47bD2431',
  // no CCTP on zksync https://developers.circle.com/stablecoins/evm-smart-contracts
  // see https://www.circle.com/blog/zksync-migration-guide
  assets: {
    usdc: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
  },
}
