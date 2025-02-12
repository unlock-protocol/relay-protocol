import { start, stop } from './src/runner'
import { proveTransactions } from './src/prove-transactions'
import { claimTransactions } from './src/claim-withdrawals'

const run = async () => {
  const { vaultService, database, schema } = await start()
  await proveTransactions({ vaultService, database, schema })
  await claimTransactions({ vaultService, database })
  await stop()
  console.log('Done!')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
