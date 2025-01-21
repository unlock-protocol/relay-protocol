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
