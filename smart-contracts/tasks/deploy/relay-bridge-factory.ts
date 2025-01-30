import { task } from 'hardhat/config'

import RelayBridgeFactoryModule from '../../ignition/modules/RelayBridgeFactoryModule'
import networks from '@relay-protocol/networks'
import { deployContract } from '../../lib/zksync'

task('deploy:bridge-factory', 'Deploy a relay bridge factory').setAction(
  async (_params, hre) => {
    const { ethers, ignition, network } = hre

    // get args value
    const { chainId } = await ethers.provider.getNetwork()
    const { hyperlaneMailbox, name: networkName } = networks[chainId.toString()]
    console.log(`deploying on ${networkName} (${chainId})...`)

    let relayBridgeAddress: string
    if (network.zksync) {
      ;({ address: relayBridgeAddress } = await deployContract(
        hre,
        'RelayBridgeFactory',
        [hyperlaneMailbox]
      ))
    } else {
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
      relayBridgeAddress = await relayBridgeFactory.getAddress()
    }
    console.log(`relayBridgeFactory deployed to: ${relayBridgeAddress}`)
  }
)
