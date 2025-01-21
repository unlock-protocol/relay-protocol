# `@relay-protocol/client`

The `@relay-protocol/client` package provides a TypeScript client library for interacting with the Relay Protocol vaults API.

## Installation

```bash
yarn add @relay-protocol/client
```

## Quick Start

```typescript
import { RelayVaultService } from '@relay-protocol/client'

// Create service instance
const vaultService = new RelayVaultService()

// Get all pools
const pools = await vaultService.getAllPools()

// Get specific pool
const pool = await vaultService.getPool({
  contractAddress: '0x000...',
})

// Get user balances
const balances = await vaultService.getAllUserBalances({
  walletAddress: '0x000...',
})
```

## Configuration

The GraphQL endpoint can be configured via the `GRAPHQL_ENDPOINT` environment variable:

```bash
GRAPHQL_ENDPOINT=https://<operation-ironclad.com>/graphql
```

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

## Usage Examples

### Basic Usage

```typescript
import { RelayVaultService } from '@relay-protocol/client'

// Create service instance with your API endpoint
const vaultService = new RelayVaultService('https://api.example.com/graphql')

// Get all pools
const pools = await vaultService.getAllPools()

// Get specific pool
const pool = await vaultService.getPool({
  contractAddress: '0x123...',
})

// Get user balances
const balances = await vaultService.getAllUserBalances({
  walletAddress: '0x456...',
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
