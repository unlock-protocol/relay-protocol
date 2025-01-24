import { task } from 'hardhat/config'
import { networks } from '@relay-protocol/networks'
import { AutoComplete } from 'enquirer'

import RelayBridgeModule from '../../ignition/modules/RelayBridgeModule'
import { getAddresses } from '../../lib/utils/deployed'

task('deploy:relay-bridge', 'Deploy a bridge proxy')
  .addOptionalParam('proxyBridge', 'The Proxy bridge asset')
  .addOptionalParam('destChain', 'Destination chain id (default to sepolia)')
  .addOptionalParam('asset', 'An ERC20 asset')
  .setAction(
    async (
      { asset: assetAddress, proxyBridge: proxyBridgeAddress },
      { ethers, ignition, run }
    ) => {
      const { chainId } = await ethers.provider.getNetwork()
      // List proxyBirdges, and select one the!
      const addresses = (await getAddresses())[chainId.toString()]
      console.log(addresses)

      if (!proxyBridgeAddress) {
        const proxyBridge = await new AutoComplete({
          name: 'proxyBridge',
          message: 'Please choose a proxy bridge',
          choices: Object.keys(addresses.BridgeProxy),
        }).run()
        proxyBridgeAddress = addresses.BridgeProxy[proxyBridge]
      }

      if (!assetAddress) {
        const asset = await new AutoComplete({
          name: 'asset',
          message:
            'Please choose the asset bridge from that bridge (make sure it is supported by the proxy bridge you selected):',
          choices: Object.keys(addresses.MyToken),
        }).run()
        assetAddress = addresses.MyToken[asset]
      }

      // .then((answer) => console.log('Answer:', answer))
      // .catch(console.error)

      console.log('Answer:', proxyBridgeAddress)
      // make sure we are deploying the latest version of the contract
      // await run('compile')

      // // get args value
      // const { hyperlaneMailbox } = networks[chainId.toString()]
      // if (!assetAddress) assetAddress = ethers.ZeroAddress

      // // parse asset name for deployment id
      // let assetName: string
      // if (assetAddress !== ethers.ZeroAddress) {
      //   const asset = await ethers.getContractAt('MyToken', assetAddress)
      //   assetName = await asset.symbol()
      // } else {
      //   assetName = 'NATIVE'
      // }

      // // deploy relay bridge
      // const { bridge } = await ignition.deploy(RelayBridgeModule, {
      //   parameters: {
      //     RelayBridge: {
      //       asset: assetAddress,
      //       bridgeProxy: proxyBridgeAddress,
      //       hyperlaneMailbox,
      //     },
      //   },
      //   deploymentId: `RelayBridge-${assetName.replace(/[^\w\s]/gi, '')}-${chainId.toString()}`,
      // })
      // console.log(`RelayBridge deployed to: ${await bridge.getAddress()}`)
    }
  )
