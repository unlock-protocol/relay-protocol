import { task } from 'hardhat/config'
import { networks } from '@relay-protocol/networks'
import { type BaseContract } from 'ethers'
import { AutoComplete } from 'enquirer'

import CCTPBridgeProxyModule from '../../ignition/modules/CCTPBridgeProxyModule'
import OPStackNativeBridgeProxyModule from '../../ignition/modules/OPStackNativeBridgeProxyModule'
import ArbitrumOrbitNativeBridgeProxyModule from '../../ignition/modules/ArbitrumOrbitNativeBridgeProxyModule'
import { getZkSyncBridgeContracts, deployContract } from '../../lib/zksync'
import ZkSyncBridgeProxyModule from '../../ignition/modules/ZkSyncBridgeProxyModule'

task('deploy:bridge-proxy', 'Deploy a bridge proxy').setAction(
  async (_, hre) => {
    const { ethers, ignition, network } = hre
    const { chainId } = await ethers.provider.getNetwork()

    const { bridges, isZKsync } = networks[chainId.toString()]

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
          deploymentId: `BridgeProxy-OPStack-${chainId.toString()}`,
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
          deploymentId: `BridgeProxy-ArbOrbit-${chainId.toString()}`,
        }
      ))
      console.log(
        `ArbOrbit bridge deployed at: ${await proxyBridge.getAddress()}`
      )
    } else if (type === 'zksync') {
      let zkSyncBridgeAddress: string
      const l2SharedDefaultBridge = bridges.zksync!.l2SharedDefaultBridge!
      const l1SharedDefaultBridge = bridges.zksync!.l1SharedDefaultBridge!
      if (isZKsync) {
        // deploy using `deployContract` helper (for zksync L2s)
        const deployArgs = [l2SharedDefaultBridge, l1SharedDefaultBridge]

        ;({ address: zkSyncBridgeAddress } = await deployContract(
          hre,
          'ZkSyncBridgeProxy',
          deployArgs as any
        ))
      } else {
        // used ignition to deploy bridge on L1
        const parameters = {
          ZkSyncBridgeProxy: {
            l2SharedDefaultBridge,
            l1SharedDefaultBridge,
          },
        }
        ;({ bridge: proxyBridge } = await ignition.deploy(
          ZkSyncBridgeProxyModule,
          {
            parameters,
            deploymentId: `BridgeProxy-ZkSync-${chainId.toString()}`,
          }
        ))
        zkSyncBridgeAddress = await proxyBridge.getAddress()
      }
      console.log(
        `Zksync BridgeProxy contract deployed at ${zkSyncBridgeAddress}`
      )
    }
  }
)
