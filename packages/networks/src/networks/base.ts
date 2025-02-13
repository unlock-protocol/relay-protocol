import { L2NetworkConfig } from '@relay-protocol/types'

export const base: L2NetworkConfig = {
  stack: 'op',
  l1ChainId: 1,
  chainId: 8453,
  isTestnet: false,
  name: 'Base',
  slug: 'base',
  hyperlaneMailbox: '0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D',
  bridges: {
    op: {
      messagePasser: '0x4200000000000000000000000000000000000016',
    },
    cctp: {
      domain: 6n,
      messenger: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
      transmitter: '0xAD09780d193884d503182aD4588450C416D6F9D4',
    },
  },
  assets: {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    udt: '0xD7eA82D19f1f59FF1aE95F1945Ee6E6d86A25B96',
  },
  rpc: ['https://rpc.unlock-protocol.com/8453'],
}
