import { RelayVaultService } from '@relay-protocol/client'
import { Client } from 'pg'

// Take all transactions that are initiated and attempts to prove them!
export const claimTransactions = async (_params: {
  vaultService: RelayVaultService
  database: Client
}) => {
  // Do stuff!
}
