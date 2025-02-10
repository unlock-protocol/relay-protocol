import { RelayVaultService } from '@relay-protocol/client'

import { Client } from 'pg'

export const DB_SCHEMA = process.env.RAILWAY_DEPLOYMENT_ID

const vaultService = new RelayVaultService(
  'https://relay-protocol-production.up.railway.app/' // TODO: add to config?
)

// Database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

export const start = async () => {
  await client.connect()

  return {
    database: client,
    vaultService,
  }
}

export const stop = async () => {
  await client.end()
}
