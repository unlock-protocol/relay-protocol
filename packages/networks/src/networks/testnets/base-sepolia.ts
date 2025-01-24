import { NetworkConfig } from '@relay-protocol/types'

export const baseSepolia: NetworkConfig = {
  l1ChainId: 11155111,
  chainId: 84532,
  hyperlaneMailbox: '0x6966b0E55883d49BFB24539356a2f8A673E02039',
  isTestnet: true,
  name: 'Base Sepolia',
  slug: 'base-sepolia',
  bridges: {
    op: {
      // All settings are hardcoded in the contract because they are shared between all networks!
    },
    cctp: {
      domain: 6n,
      messenger: '0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5',
      transmitter: '0x7865fAfC2db2093669d92c0F33AeEF291086BEFD',
    },
  },
  assets: {
    usdc: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
}
