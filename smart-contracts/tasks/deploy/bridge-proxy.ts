import { task } from 'hardhat/config'
import { networks } from '@relay-protocol/networks'
import { type BaseContract } from 'ethers'
import { AutoComplete } from 'enquirer'

import CCTPBridgeProxyModule from '../../ignition/modules/CCTPBridgeProxyModule'
import OPStackNativeBridgeProxyModule from '../../ignition/modules/OPStackNativeBridgeProxyModule'
import ArbitrumOrbitNativeBridgeProxyModule from '../../ignition/modules/ArbitrumOrbitNativeBridgeProxyModule'
// import { getAddresses } from '../../lib/utils/deployed'

task('deploy:bridge-proxy', 'Deploy a bridge proxy').setAction(
  async (_, { ethers, ignition }) => {
    const { chainId } = await ethers.provider.getNetwork()

    const { bridges, l1ChainId: destChain } = networks[chainId.toString()]

    if (!destChain) {
      throw new Error('This chain does not have a corresponding L1 chain')
    }

    const type = await new AutoComplete({
      name: 'type',
      message: 'Please choose a proxy type?',
      choices: Object.keys(bridges),
    }).run()

    // get args value
    const { name } = networks[chainId.toString()]
    console.log(`deploying ${type} proxy bridge on ${name} (${chainId})...`)

    // deploy bridge proxy
    let proxyBridge: BaseContract
    if (type === 'cctp') {
      const {
        bridges: {
          cctp: { messenger, transmitter },
        },
        assets: { usdc: USDC },
      } = networks[chainId.toString()]
      const parameters = {
        CCTPBridgeProxy: {
          messenger,
          transmitter,
          usdc: USDC,
        },
      }
      // deploy CCTP bridge
      ;({ bridge: proxyBridge } = await ignition.deploy(CCTPBridgeProxyModule, {
        parameters,
        deploymentId: `BridgeProxy-CCTP-${chainId.toString()}`,
      }))
      console.log(`CCTP bridge deployed at: ${await proxyBridge.getAddress()}`)
    } else if (type === 'op') {
      const {
        bridges: {
          op: { portalProxy },
        },
      } = networks[destChain]

      const parameters = {
        OPStackNativeBridgeProxy: {
          portalProxy,
        },
      }
      // deploy OP bridge
      ;({ bridge: proxyBridge } = await ignition.deploy(
        OPStackNativeBridgeProxyModule,
        {
          parameters,
          deploymentId: `BridgeProxy-OPStack-${chainId.toString()}`,
        }
      ))
      console.log(
        `OPStack bridge deployed at: ${await proxyBridge.getAddress()}`
      )
    } else if (type === 'arb') {
      const {
        bridges: {
          arb: { routerGateway, outbox },
        },
      } = networks[chainId.toString()]

      const parameters = {
        ArbitrumOrbitNativeBridgeProxy: {
          routerGateway,
          outbox,
        },
      }

      // deploy ARB bridge
      ;({ bridge: proxyBridge } = await ignition.deploy(
        ArbitrumOrbitNativeBridgeProxyModule,
        {
          parameters,
          deploymentId: `BridgeProxy-ArbOrbit-${chainId.toString()}`,
        }
      ))
      console.log(
        `ArbOrbit bridge deployed at: ${await proxyBridge.getAddress()}`
      )
    }
  }
)
