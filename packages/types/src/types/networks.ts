export interface NetworkConfig {
  chainId: number | bigint
  name: string
  slug: string
  usdc: {
    domain: bigint
    messenger: string
    transmitter: string
    token: string
  }
  udt?: string
  rpc?: string
  hyperlaneMailbox: string
  isTestnet: boolean
  arb?: {
    routerGateway: string
    outbox: string
    rollup: string
  }
  op?: {
    portalProxy: string
    disputeGame: string
  }
  weth?: string
  uniswapV3?: {
    universalRouterAddress: string
  }
}

export interface NetworkConfigs {
  [networkId: string]: NetworkConfig
}
