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
  bridges: {
    zksync: true,
  },
  assets: {
    usdc: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4',
    dai: '0x4B9eb6c0b6ea15176BBF62841C6B2A8a398cb656',
    eth: '0x000000000000000000000000000000000000800A',
  },
}
