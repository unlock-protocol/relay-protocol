import { RelayClient } from '../client'
import type {
  GetAllPoolsQuery,
  GetRelayPoolQuery,
  GetUserBalancesQuery,
} from '../generated/graphql'

/**
 * RelayVaultService provides a high-level interface for interacting with Relay Protocol vaults
 * through the GraphQL API. It abstracts away the complexity of direct GraphQL queries and
 * provides simple, strongly-typed methods for common operations.
 *
 * Usage:
 * ```typescript
 * const vaultService = new RelayVaultService('https://api.example.com/graphql')
 *
 * // Get all pools
 * const pools = await vaultService.getAllPools()
 *
 * // Get specific pool
 * const pool = await vaultService.getPool({ contractAddress: "0x..." })
 * ```
 */
export class RelayVaultService {
  private client: RelayClient

  /**
   * Creates a new RelayVaultService instance
   *
   * @param endpoint - The GraphQL API endpoint URL
   * @throws Will throw an error if the endpoint URL is invalid
   */
  constructor(endpoint: string) {
    if (!endpoint) {
      throw new Error('GraphQL endpoint URL is required')
    }
    this.client = new RelayClient(endpoint)
  }

  /**
   * Retrieves all relay pools with their basic information including:
   * - Contract address
   * - Asset details
   * - Chain ID
   * - Outstanding debt
   * - Total assets and shares
   * - Origin bridges information
   *
   * @returns Promise containing the relay pools data and pagination info
   * @throws Will throw an error if the GraphQL query fails
   */
  async getAllPools(): Promise<GetAllPoolsQuery['relayPools']> {
    const { data } = await this.client.sdk.GetAllPools()
    return data.relayPools
  }

  /**
   * Retrieves detailed information about a specific relay pool
   *
   * @param params.contractAddress - The Ethereum address of the relay pool contract
   * @returns Promise containing the pool details including creator, assets, and metrics
   * @throws Will throw an error if the pool is not found or the query fails
   */
  async getPool(params: {
    contractAddress: string
  }): Promise<GetRelayPoolQuery['relayPool']> {
    const { data } = await this.client.sdk.GetRelayPool({
      contractAddress: params.contractAddress,
    })
    return data.relayPool
  }

  /**
   * Retrieves all balances for a specific user across all relay pools
   *
   * @param params.walletAddress - The Ethereum address of the user's wallet
   * @returns Promise containing the user's balances across all pools
   * @throws Will throw an error if the query fails
   */
  async getAllUserBalances(params: {
    walletAddress: string
  }): Promise<GetUserBalancesQuery['userBalances']> {
    const { data } = await this.client.sdk.GetUserBalances({
      walletAddress: params.walletAddress,
    })
    return data.userBalances
  }

  /**
   * Retrieves a user's balance and activity in a specific pool
   *
   * @param params.walletAddress - The Ethereum address of the user's wallet
   * @param params.poolAddress - The Ethereum address of the relay pool contract
   * @returns Promise containing the user's balance, deposits, withdrawals, and pool details
   * @throws Will throw an error if the pool is not found or the query fails
   */
  async getUserBalanceInPool(params: {
    walletAddress: string
    poolAddress: string
  }) {
    const { data } = await this.client.sdk.GetUserBalanceInPool({
      walletAddress: params.walletAddress,
      poolAddress: params.poolAddress,
    })
    return data.userBalances
  }
}
