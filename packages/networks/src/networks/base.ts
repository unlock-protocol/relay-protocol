import { NetworkConfig } from '@relay-protocol/types'

export const base: NetworkConfig = {
  l1ChainId: 1,
  chainId: 8453,
  isTestnet: false,
  name: 'Base',
  slug: 'base',
  hyperlaneMailbox: '0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D',
  bridges: {
    op: {
      // All settings are hardcoded in the contract because they are shared between all networks!
    },
    cctp: {
      domain: 6n,
      messenger: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
      transmitter: '0xAD09780d193884d503182aD4588450C416D6F9D4',
    },
  },
  assets: {
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
  uniswapV3: {
    universalRouterAddress: '0x198EF79F1F515F02dFE9e3115eD9fC07183f02fC',
  },
  rpc: ['https://rpc.unlock-protocol.com/8453'],
}
