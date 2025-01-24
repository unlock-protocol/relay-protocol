import { task } from 'hardhat/config'

import RelayBridgeFactoryModule from '../../ignition/modules/RelayBridgeFactoryModule'
import networks from '@relay-protocol/networks'

task('deploy:bridge-factory', 'Deploy a relay bridge factory').setAction(
  async (_params, { ethers, ignition }) => {
    // get args value
    const { chainId } = await ethers.provider.getNetwork()
    const { hyperlaneMailbox, name: networkName } = networks[chainId.toString()]
    console.log(`deploying on ${networkName} (${chainId})...`)

    // deploy the pool using ignition
    const parameters = {
      RelayBridgeFactory: {
        hyperlaneMailbox,
      },
    }

    const { relayBridgeFactory } = await ignition.deploy(
      RelayBridgeFactoryModule,
      {
        parameters,
        deploymentId: `RelayBridgeFactory-${chainId.toString()}`,
      }
    )
    console.log(
      `relayBridgeFactory deployed to: ${await relayBridgeFactory.getAddress()}`
    )
  }
)
