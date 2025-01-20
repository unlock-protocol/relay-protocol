import { task } from 'hardhat/config'
import { networks } from '@relay-protocol/networks'
import { type BaseContract } from 'ethers'

import CCTPBridgeProxyModule from '../../ignition/modules/CCTPBridgeProxyModule'
import OPStackNativeBridgeProxyModule from '../../ignition/modules/OPStackNativeBridgeProxyModule'

const SUPPORTED_PROXY_BRIDGES = ['op', 'cctp', 'arb']

task('deploy:bridge-proxy', 'Deploy a bridge proxy')
  .addOptionalParam(
    'type',
    `Pick a kind of bridge to deploy (supported: ${SUPPORTED_PROXY_BRIDGES.join(',')}, default: 'op'`
  )
  .addOptionalParam('destChain', 'Destination chain id (default to sepolia)')
  .setAction(
    async ({ type = 'op', destChain = 11155111 }, { ethers, ignition }) => {
      // check cli args
      if (!SUPPORTED_PROXY_BRIDGES.includes(type)) {
        throw Error(`Unsupported bridge type ${type}`)
      }

      // get args value
      const { chainId } = await ethers.provider.getNetwork()
      const {
        usdc: { token: USDC, messenger, transmitter },
        name,
      } = networks[chainId.toString()]
      console.log(`deploying ${type} proxy bridge on ${name} (${chainId})...`)

      const {
        op: { portalProxy },
      } = networks[destChain]

      const parameters = {
        CCTPBridgeProxy: {
          messenger,
          transmitter,
          usdc: USDC,
        },
        OPStackNativeBridgeProxy: {
          portalProxy,
        },
      }

      // deploy bridge proxy
      let proxyBridge: BaseContract
      if (type === 'cctp') {
        // deploy CCTP bridge
        ;({ bridge: proxyBridge } = await ignition.deploy(
          CCTPBridgeProxyModule,
          {
            parameters,
            deploymentId: `BridgeProxy-CCTP-${chainId.toString()}`,
          }
        ))
        console.log(
          `CCTP bridge deployed at: ${await proxyBridge.getAddress()}`
        )
      } else if (type === 'op') {
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
        throw Error('Arb proxy bridge not implemented yet')
      }
    }
  )
