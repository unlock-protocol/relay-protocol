import { task } from 'hardhat/config'
import { networks } from '@relay-protocol/networks'

import RelayBridgeModule from '../../ignition/modules/RelayBridgeModule'

task('deploy:relay-bridge', 'Deploy a bridge proxy')
  .addParam('proxyBridge', 'The Proxy bridge asset')
  .addOptionalParam('destChain', 'Destination chain id (default to sepolia)')
  .addOptionalParam('asset', 'An ERC20 asset')
  .setAction(
    async (
      { asset: assetAddress, proxyBridge: proxyBridgeAddress },
      { ethers, ignition }
    ) => {
      // get args value
      const { chainId } = await ethers.provider.getNetwork()
      const { hyperlaneMailbox } = networks[chainId.toString()]
      if (!assetAddress) assetAddress = ethers.ZeroAddress

      // parse asset name for deployment id
      let assetName: string
      if (assetAddress !== ethers.ZeroAddress) {
        const asset = await ethers.getContractAt('MyToken', assetAddress)
        assetName = await asset.symbol()
      } else {
        assetName = 'NATIVE'
      }

      // deploy relay bridge
      const { bridge } = await ignition.deploy(RelayBridgeModule, {
        parameters: {
          RelayBridge: {
            asset: assetAddress,
            bridgeProxy: proxyBridgeAddress,
            hyperlaneMailbox,
          },
        },
        deploymentId: `RelayBridge-${assetName.replace(/[^\w\s]/gi, '')}-${chainId.toString()}`,
      })
      console.log(`RelayBridge deployed to: ${await bridge.getAddress()}`)
    }
  )
