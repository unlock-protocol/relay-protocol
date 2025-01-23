# `@relay-protocol/client`

The `@relay-protocol/client` package provides a TypeScript client library for interacting with the Relay Protocol vaults API.

## Installation

```bash
yarn add @relay-protocol/client
```

## Usage

```typescript
import { RelayVaultService } from '@relay-protocol/client'

// Create service instance with your API endpoint
const vaultService = new RelayVaultService('https://api.example.com/graphql')

// Execute queries with type safety
interface PoolsResponse {
  relayPools: {
    items: Array<{
      contractAddress: string
      asset: string
      chainId: number
    }>
  }
}

const data = await vaultService.query<PoolsResponse>(`
  query GetAllPools {
    relayPools(limit: 10) {
      items {
        contractAddress
        asset
        chainId
      }
    }
  }
`)

// With variables
interface UserBalancesResponse {
  userBalances: {
    items: Array<{
      relayPool: string
      balance: string
    }>
  }
}

const balances = await vaultService.query<UserBalancesResponse>(
  `query GetUserBalances($walletAddress: String!) {
    userBalances(where: { wallet: $walletAddress }) {
      items {
        relayPool
        balance
      }
    }
  }`,
  { walletAddress: '0x123...' }
)
```

## Development

```bash
# Install dependencies
yarn install

# Build package
yarn build

# Watch mode
yarn dev
```

## Configuration

The service requires a GraphQL endpoint URL to be provided when instantiating:

```typescript
const vaultService = new RelayVaultService('https://api.example.com/graphql')
```
