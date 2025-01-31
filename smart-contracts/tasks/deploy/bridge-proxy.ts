import { task } from 'hardhat/config'
import { networks } from '@relay-protocol/networks'
import { type BaseContract } from 'ethers'
import { AutoComplete } from 'enquirer'

import CCTPBridgeProxyModule from '../../ignition/modules/CCTPBridgeProxyModule'
import OPStackNativeBridgeProxyModule from '../../ignition/modules/OPStackNativeBridgeProxyModule'
import ArbitrumOrbitNativeBridgeProxyModule from '../../ignition/modules/ArbitrumOrbitNativeBridgeProxyModule'

task('deploy:bridge-proxy', 'Deploy a bridge proxy')
  .addOptionalParam('type', 'the type of bridge to deploy')
  .setAction(async ({ type }, { ethers, ignition }) => {
    const { chainId } = await ethers.provider.getNetwork()

    const { bridges } = networks[chainId.toString()]

    if (!type) {
      type = await new AutoComplete({
        name: 'type',
        message: 'Please choose a proxy type?',
        choices: Object.keys(bridges),
      }).run()
    }

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
        deploymentId: `BridgeProxy-cctp-${chainId.toString()}`,
      }))
      console.log(`CCTP bridge deployed at: ${await proxyBridge.getAddress()}`)
    } else if (type === 'op') {
      const parameters = {
        OPStackNativeBridgeProxy: {
          portalProxy: bridges.op!.portalProxy! || ethers.ZeroAddress, // Only used on the L1 deployments (to claim the assets)
        },
      }
      // deploy OP bridge
      ;({ bridge: proxyBridge } = await ignition.deploy(
        OPStackNativeBridgeProxyModule,
        {
          parameters,
          deploymentId: `BridgeProxy-op-${chainId.toString()}`,
        }
      ))
      console.log(
        `OPStack bridge deployed at: ${await proxyBridge.getAddress()}`
      )
    } else if (type === 'arb') {
      const parameters = {
        ArbitrumOrbitNativeBridgeProxy: {
          routerGateway: bridges.arb!.routerGateway,
          outbox: bridges.arb!.outbox || ethers.ZeroAddress, // Only used on the L1 deployments (to claim the assets)
        },
      }

      // deploy ARB bridge
      ;({ bridge: proxyBridge } = await ignition.deploy(
        ArbitrumOrbitNativeBridgeProxyModule,
        {
          parameters,
          deploymentId: `BridgeProxy-arb-${chainId.toString()}`,
        }
      ))
      console.log(
        `ArbOrbit bridge deployed at: ${await proxyBridge.getAddress()}`
      )
    }

    return proxyBridge.getAddress()
  })
