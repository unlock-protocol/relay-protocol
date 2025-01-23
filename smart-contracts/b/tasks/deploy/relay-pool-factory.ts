import { task } from 'hardhat/config'

import { networks } from '@relay-protocol/networks'
import RelayPoolFactoryModule from '../../ignition/modules/RelayPoolFactoryModule'

task('deploy:pool-factory', 'Deploy a relay pool factory').setAction(
  async (_params, { ethers, ignition }) => {
    // get args value
    const { chainId } = await ethers.provider.getNetwork()
    const {
      hyperlaneMailbox,
      name: networkName,
      weth,
    } = networks[chainId.toString()]
    console.log(`deploying on ${networkName} (${chainId})...`)

    // deploy the pool using ignition
    const parameters = {
      RelayPoolFactory: {
        hyperlaneMailbox,
        weth,
      },
    }
    const { relayPoolFactory } = await ignition.deploy(RelayPoolFactoryModule, {
      parameters,
      deploymentId: `RelayPoolFactory-${chainId.toString()}`,
    })
    console.log(
      `relayPoolFactory deployed to: ${await relayPoolFactory.getAddress()}`
    )
  }
)
