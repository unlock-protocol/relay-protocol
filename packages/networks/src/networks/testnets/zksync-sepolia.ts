import { NetworkConfig } from '@relay-protocol/types'

export const zkSyncSepolia: NetworkConfig = {
  chainId: 300,
  hyperlaneMailbox: '0xfFAEF09B3cd11D9b20d1a19bECca54EEC2884766',
  isTestnet: true,
  name: 'ZKsync Sepolia Testnet',
  slug: 'zksync-sepolia',
  rpc: 'https://sepolia.era.zksync.dev',
  assets: {
    usdc: '0xAe045DE5638162fa134807Cb558E15A3F5A7F853',
  },
}
