import { RelayClient } from '../client'
import type { DocumentNode } from 'graphql'
import type { Variables } from 'graphql-request'

/**
 * RelayVaultService provides a high-level interface for interacting with Relay Protocol vaults
 * through the GraphQL API.
 *
 * Usage:
 * ```typescript
 * const vaultService = new RelayVaultService('https://api.example.com/graphql')
 * const { data } = await vaultService.query(GET_ALL_POOLS)
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
   * Execute a raw GraphQL query with variables
   *
   * @param query - The GraphQL query document
   * @param variables - Query variables (optional)
   * @returns Promise containing the query result
   * @throws Will throw an error if the query fails
   *
   * @example
   * ```typescript
   * const { data } = await vaultService.query(GET_ALL_POOLS)
   * // Or with variables
   * const { data } = await vaultService.query(GET_USER_BALANCES, { walletAddress: "0x..." })
   * ```
   */
  async query<TData = any, TVariables extends Variables = Variables>(
    query: string | DocumentNode,
    variables?: TVariables
  ): Promise<TData> {
    return this.client.query<TData, TVariables>(query, variables)
  }
}
