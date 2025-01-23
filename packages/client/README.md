# `@relay-protocol/client`

The `@relay-protocol/client` package provides a TypeScript client library for interacting with the Relay Protocol vaults API.

## Installation

```bash
yarn add @relay-protocol/client
```

## Usage

### Basic Usage

```typescript
import { RelayVaultService } from '@relay-protocol/client'

// Create service instance with your API endpoint
const vaultService = new RelayVaultService('https://api.example.com/graphql')

// Get all pools with their details
const { items: pools } = await vaultService.getAllPools()

// Get specific pool details
const pool = await vaultService.getPool({
  contractAddress: '0x123...',
})

// Get user balances across all pools
const { items: balances } = await vaultService.getAllUserBalances({
  walletAddress: '0x456...',
})

// Get user balance in specific pool
const { items: poolBalances } = await vaultService.getUserBalanceInPool({
  walletAddress: '0x456...',
  poolAddress: '0x123...',
})
```

### Custom Queries

The package exports raw GraphQL queries and supports custom query execution:

```typescript
import { RelayVaultService, GET_USER_BALANCES } from '@relay-protocol/client'

const vaultService = new RelayVaultService('https://api.example.com/graphql')

// Using exported queries
const { data } = await vaultService.query(GET_USER_BALANCES, {
  walletAddress: '0x123...',
})

// With type safety
interface UserBalancesData {
  userBalances: {
    items: Array<{
      relayPool: string
      balance: string
    }>
  }
}

const { data } = await vaultService.query<UserBalancesData>(GET_USER_BALANCES, {
  walletAddress: '0x123...',
})
```

Available raw queries:

- `GET_ALL_POOLS` - Fetch all relay pools
- `GET_POOL` - Get specific pool details
- `GET_USER_BALANCES` - Get user balances across all pools
- `GET_USER_BALANCE_IN_POOL` - Get user balance in specific pool

## Development

```bash
# Install dependencies
yarn install

# Generate GraphQL types
yarn codegen

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
