import { NetworkConfig } from '@relay-protocol/types'

export const arbitrumOne: NetworkConfig = {
  l1ChainId: 1,
  bridges: {
    arb: {
      routerGateway: '0x5288c571Fd7aD117beA99bF60FE0846C4E84F933',
    },
    cctp: {
      domain: 3n,
      messenger: '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
      transmitter: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
    },
  },
  chainId: 42161,
  hyperlaneMailbox: '0x979Ca5202784112f4738403dBec5D0F3B9daabB9',
  isTestnet: false,
  name: 'Arbitrum',
  slug: 'arbitrum',
  assets: {
    udt: '0xd5d3aA404D7562d09a848F96a8a8d5D65977bF90',
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
}
