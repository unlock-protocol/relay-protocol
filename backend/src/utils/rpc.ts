import { http } from 'viem'

/**
 * Get the RPC URL for a given chain ID
 * @param chainId - The chain ID
 * @returns The RPC URL
 */
const getRpcUrl = (chainId: number): string => {
  const urlMap: Record<number, string> = {
    1: 'https://rpc.unlock-protocol.com/1',
    10: 'https://rpc.unlock-protocol.com/10',
    8453: 'https://rpc.unlock-protocol.com/8453',
    84532: 'https://rpc.unlock-protocol.com/84532',
    137: 'https://rpc.unlock-protocol.com/137',
    11155111: 'https://rpc.unlock-protocol.com/11155111',
    11155420: 'https://optimism-sepolia.gateway.tenderly.co',
    421614: 'https://arbitrum-sepolia.gateway.tenderly.co',
  }

  const url = urlMap[chainId]
  if (!url) {
    throw new Error(`Unsupported chain ID: ${chainId}`)
  }

  return url
}

/**
 * Create a network config for a given chain ID
 * @param chainId - The chain ID
 * @returns The network config
 */
export const createNetworkConfig = (chainId: number) => ({
  chainId,
  transport: http(getRpcUrl(chainId)),
  pollingInterval: 15_000,
})
