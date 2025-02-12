import { RelayVaultService } from '@relay-protocol/client'
import { Client } from 'pg'
import { getLatestDatabaseSchema } from './util/retrieve-schema'

const vaultService = new RelayVaultService(
  'https://relay-protocol-production.up.railway.app/' // TODO: add to config?
)

// Database
const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

export const start = async () => {
  await client.connect()
  const schema = process.env.RAILWAY_PROJECT_ID
    ? await getLatestDatabaseSchema()
    : 'public' // local development

  return {
    database: client,
    vaultService,
    schema,
  }
}

export const stop = async () => {
  await client.end()
}
