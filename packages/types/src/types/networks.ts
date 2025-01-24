export interface NetworkConfig {
  chainId: number | bigint
  name: string
  slug: string
  cctp: {
    domain: bigint
    messenger: string
    transmitter: string
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
  assets?: NetworkAssets
}

interface NetworkAssets {
  [asset: string]: string
}

export interface NetworkConfigs {
  [networkId: string]: NetworkConfig
}
