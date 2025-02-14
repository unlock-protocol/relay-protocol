import { start, stop } from './src/runner'
import { proveTransactions } from './src/prove-transactions'
import { claimTransactions } from './src/claim-withdrawals'

const run = async () => {
  const { vaultService } = await start()
  // await proveTransactions({ vaultService })
  await claimTransactions({ vaultService })
  await stop()
  console.log('Done!')
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
