import { task } from 'hardhat/config'
import { networks } from '@relay-protocol/networks'
import { type BaseContract } from 'ethers'

import CCTPBridgeProxyModule from '../../ignition/modules/CCTPBridgeProxyModule'
import OPStackNativeBridgeProxyModule from '../../ignition/modules/OPStackNativeBridgeProxyModule'
import ArbitrumOrbitNativeBridgeProxyModule from '../../ignition/modules/ArbitrumOrbitNativeBridgeProxyModule'

const SUPPORTED_PROXY_BRIDGES = ['op', 'cctp', 'arb']

task('deploy:bridge-proxy', 'Deploy a bridge proxy')
  .addOptionalParam(
    'type',
    `Pick a kind of bridge to deploy (supported: ${SUPPORTED_PROXY_BRIDGES.join(',')}, default: 'op'`
  )
  .addOptionalParam('destChain', 'Destination chain id (default to sepolia)')
  .setAction(
    async (
      { type = 'op', destChain = 11155111 },
      { ethers, ignition, run }
    ) => {
      // check cli args
      if (!SUPPORTED_PROXY_BRIDGES.includes(type)) {
        throw Error(`Unsupported bridge type ${type}`)
      }

      // make sure we are deploying the latest version of the contract
      await run('compile')

      // get args value
      const { chainId } = await ethers.provider.getNetwork()
      const { name } = networks[chainId.toString()]
      console.log(`deploying ${type} proxy bridge on ${name} (${chainId})...`)

      // deploy bridge proxy
      let proxyBridge: BaseContract
      if (type === 'cctp') {
        const {
          usdc: { token: USDC, messenger, transmitter },
        } = networks[chainId.toString()]
        const parameters = {
          CCTPBridgeProxy: {
            messenger,
            transmitter,
            usdc: USDC,
          },
        }
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
        const {
          op: { portalProxy },
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
          arb: { routerGateway, outbox },
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
