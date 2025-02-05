import { task } from 'hardhat/config'
import { networks } from '@relay-protocol/networks'
import { AutoComplete } from 'enquirer'
import { getAddresses } from '../../lib/utils/deployed'
import { getEvent } from '@relay-protocol/helpers'

task('deploy:relay-bridge', 'Deploy a bridge proxy')
  .addOptionalParam('proxyBridge', 'The Proxy bridge asset')
  .addOptionalParam('asset', 'An ERC20 asset')
  .setAction(
    async (
      { asset: assetAddress, proxyBridge: proxyBridgeAddress },
      { ethers }
    ) => {
      const { chainId } = await ethers.provider.getNetwork()
      const deployedContracts = (await getAddresses())[chainId.toString()]

      if (!deployedContracts) {
        throw new Error(
          'This chain does not have any deployed contracts. Please deploy BridgeProxy and RelayBridgeFactory first.'
        )
      }

      const { BridgeProxy, RelayBridgeFactory } = deployedContracts

      const { assets, l1ChainId } = networks[chainId.toString()]

      if (!l1ChainId) {
        throw new Error('This chain does not have a corresponding L1 chain')
      }

      if (!RelayBridgeFactory) {
        throw new Error('This chain does not have a RelayBridgeFactory')
      }

      if (!proxyBridgeAddress) {
        // List proxyBirdges, and select one the!
        const proxyBridge = await new AutoComplete({
          name: 'proxyBridge',
          message: 'Please choose a proxy bridge',
          choices: Object.keys(BridgeProxy),
        }).run()
        proxyBridgeAddress = BridgeProxy[proxyBridge]
      }

      if (!assetAddress) {
        const asset = await new AutoComplete({
          name: 'asset',
          message:
            'Please choose the asset for your relay bridge (make sure it is supported by the proxy bridge you selected):',
          choices: ['native', ...Object.keys(assets)],
        }).run()
        if (asset === 'native') {
          assetAddress = ethers.ZeroAddress
        } else {
          assetAddress = assets[asset]
        }
      }

      const factoryContract = await ethers.getContractAt(
        'RelayBridgeFactory',
        RelayBridgeFactory
      )

      const tx = await factoryContract.deployBridge(
        assetAddress,
        proxyBridgeAddress
      )
      const receipt = await tx.wait()
      const event = await getEvent(
        receipt!,
        'BridgeDeployed',
        factoryContract.interface
      )

      console.log(`RelayBridge deployed to: ${event.args.bridge}`)
    }
  )
