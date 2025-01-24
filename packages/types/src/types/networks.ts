export interface NetworkConfig {
  chainId: number | bigint
  l1ChainId?: number | bigint
  name: string
  slug: string
  bridges: {
    cctp: {
      domain: bigint
      messenger: string
      transmitter: string
    }
    arb?: {
      routerGateway: string
      outbox?: string
      rollup?: string
    }
    op?: {
      portalProxy: string
      disputeGame: string
    }
  }
  rpc?: string
  hyperlaneMailbox: string
  isTestnet: boolean
  assets: NetworkAssets
}

interface NetworkAssets {
  [asset: string]: string
}

export interface NetworkConfigs {
  [networkId: string]: NetworkConfig
}
