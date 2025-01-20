import fs from 'fs-extra'
import { toObject } from '../lib/utils'
import { mainnets } from '@relay-protocol/networks'

import path from 'path'
const destFolder = path.resolve('./ignition/params')

const parseNetwork = (network: any) => {
  const { usdc } = network
  return toObject({
    ...network,
    CCTPBridgeProxy: { ...usdc, usdc: usdc.token },
  })
}

async function main() {
  await Promise.all(
    Object.keys(networks).map((id) =>
      fs.outputJSON(
        path.join(destFolder, `${id}.json`),
        parseNetwork(networks[parseInt(id) as keyof typeof networks]),
        { spaces: 2 }
      )
    )
  )
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
