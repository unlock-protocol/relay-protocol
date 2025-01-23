import { gql } from 'graphql-request'

export const GET_ALL_POOLS = gql`
  query GetAllPools {
    relayPools(limit: 10) {
      items {
        contractAddress
        asset
        chainId
        outstandingDebt
        totalAssets
        totalShares
        origins(limit: 10) {
          totalCount
          items {
            proxyBridge
            originChainId
            originBridge
          }
        }
      }
    }
  }
`

export const GET_RELAY_POOL = gql`
  query GetRelayPool($contractAddress: String!) {
    relayPool(contractAddress: $contractAddress) {
      contractAddress
      creator
      asset
      yieldPool
      outstandingDebt
      totalAssets
      totalShares
      chainId
      createdAt
      createdAtBlock
    }
  }
`

export const GET_USER_BALANCES = gql`
  query GetUserBalances($walletAddress: String!) {
    userBalances(where: { wallet: $walletAddress }) {
      items {
        relayPool
        balance
        pool {
          contractAddress
          chainId
          asset
          totalAssets
          totalShares
          outstandingDebt
        }
      }
    }
  }
`

export const GET_USER_BALANCE_IN_POOL = gql`
  query GetUserBalanceInPool($walletAddress: String!, $poolAddress: String!) {
    userBalances(where: { wallet: $walletAddress, relayPool: $poolAddress }) {
      items {
        relayPool
        balance
        totalDeposited
        totalWithdrawn
        lastUpdated
        pool {
          contractAddress
          chainId
          asset
          totalAssets
          totalShares
          outstandingDebt
        }
      }
    }
  }
`
