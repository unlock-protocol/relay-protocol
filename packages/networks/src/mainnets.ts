// for usdc/circle, see https://developers.circle.com/stablecoins/supported-domains
// https://docs.hyperlane.xyz/docs/reference/addresses/mailbox-addresses

// for arb
// see https://docs.arbitrum.io/build-decentralized-apps/reference/contract-addresses

export const mainnets = {
  1: {
    chainId: 1,
    name: 'Ethereum',
    slug: 'ethereum',
    usdc: {
      domain: 0n,
      messenger: '0xBd3fa81B58Ba92a82136038B25aDec7066af3155',
      transmitter: '0x0a992d191DEeC32aFe36203Ad87D7d289a738F81',
      token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    },
    udt: '0x90DE74265a416e1393A450752175AED98fe11517',
    hyperlaneMailbox: '0xc005dc82818d67AF737725bD4bf75435d065D239',
    isTestNet: false,
    arb: {
      routerGateway: '0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef',
      outbox: '0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840',
      rollup: '0x5eF0D09d1E6204141B4d37530808eD19f60FBa35',
    },
    op: {
      portalProxy: '0xbEb5Fc579115071764c7423A4f12eDde41f106Ed',
    },
    weth: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  },
  10: {
    chainId: 10,
    name: 'OP Mainnet',
    slug: 'optimism',
    usdc: {
      domain: 2n,
      token: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      messenger: '0x2B4069517957735bE00ceE0fadAE88a26365528f',
      transmitter: '0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8',
    },
    weth: '0x4200000000000000000000000000000000000006',
    isTestNet: false,
    hyperlaneMailbox: '0xd4C1905BB1D26BC93DAC913e13CaCC278CdCC80D',
    udt: '0xc709c9116dBf29Da9c25041b13a07A0e68aC5d2D',
  },
  42161: {
    name: 'Arbitrum',
    slug: 'arbitrum',
    chainId: 42161,
    usdc: {
      domain: 3n,
      messenger: '0x19330d10D9Cc8751218eaf51E8885D058642E08A',
      transmitter: '0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca',
      token: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    },

    arb: {
      routerGateway: '0x5288c571Fd7aD117beA99bF60FE0846C4E84F933',
    },
    udt: '0xd5d3aA404D7562d09a848F96a8a8d5D65977bF90',
    isTestNet: false,
  },
  8453: {
    name: 'Base',
    slug: 'base',
    chainId: 8453,
    usdc: {
      domain: 6n,
      messenger: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
      transmitter: '0xAD09780d193884d503182aD4588450C416D6F9D4',
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    },
    isTestNet: false,
  },
}
