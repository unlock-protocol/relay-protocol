import { task } from 'hardhat/config'

import { networks } from '@relay-protocol/networks'

task('networks:list', 'List all suported networks').setAction(async () => {
  Object.values(networks).forEach((network) => {
    console.log(`${network.name} (${network.chainId} ${network.slug})`)
  })
})
