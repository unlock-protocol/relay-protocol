export interface NetworkConfig {
  chainId: number | bigint
  name: string
  slug: string
  cctp: {
    domain: bigint
    messenger: string
    transmitter: string
  }
  rpc?: string
  hyperlaneMailbox: string
  isTestnet: boolean
  l1ChainId?: number
  arb?: {
    routerGateway: string
    outbox: string
    rollup: string
  }
  op?: {
    portalProxy: string
    disputeGame: string
  }
  assets: NetworkAssets
}

interface NetworkAssets {
  [asset: string]: string
}

export interface NetworkConfigs {
  [networkId: string]: NetworkConfig
}
