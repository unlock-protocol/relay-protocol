import { task } from 'hardhat/config'

import { networks } from '@relay-protocol/networks'
import { getStataToken, getEvent, getProvider } from '@relay-protocol/helpers'

task('deploy:pool', 'Deploy a relay pool')
  .addParam('factory', 'Address of the factory')
  .addParam('asset', 'An ERC20 asset')
  .addOptionalParam('yieldPool', 'A yield pool address')
  .addOptionalParam('fee', 'Bridge fee')
  .addParam(
    'origins',
    'Origins, as JSON array: [{"chainId": 11155420, "bridge": "0xD26c05a33349a6DeD02DD9360e1ef303d1246fb6", "maxDebt": 1000000000000, "proxyBridge": "0x4e46Dc422c61d41Ce835234D29e7f9f1C54968Fb"}]'
  )
  .setAction(
    async (
      { factory, asset, yieldPool, origins, bridgeFee = 0 },
      { ethers }
    ) => {
      // get args value
      const { chainId } = await ethers.provider.getNetwork()
      const { name: networkName, weth } = networks[chainId.toString()]
      console.log(`deploying on ${networkName} (${chainId})...`)

      // get aave yield pool
      if (!yieldPool) {
        yieldPool = await getStataToken(asset, chainId)
      }

      // parse asset metadata
      const assetContract = await ethers.getContractAt('MyToken', asset)
      const assetSymbol = await assetContract.symbol()
      const name = `${await assetContract.name()} Relay Pool`
      const symbol = `${assetSymbol}-REL`

      // Check that the yield pool asset matche's
      const yieldPoolContract = await ethers.getContractAt(
        'MyYieldPool',
        yieldPool
      )
      const yieldPoolAsset = await yieldPoolContract.asset()
      if (asset !== yieldPoolAsset) {
        const yieldPoolAssetContract = await ethers.getContractAt(
          'MyToken',
          yieldPoolAsset
        )
        const originAssetSymbol = await yieldPoolAssetContract.symbol()
        console.error(
          `Asset mismatch! The pool expects a different asset (${assetSymbol}) than the yield pool (${originAssetSymbol})!`
        )
        process.exit(1)
      }

      const factoryContract = await ethers.getContractAt(
        'RelayPoolFactory',
        factory
      )

      // Check that each origin's asset matches
      // We need to check the symbols...
      const authorizedOrigins = JSON.parse(origins)
      if (authorizedOrigins.length === 0) {
        console.error('No authorized origins provided!')
        process.exit(1)
      }
      for (let i = 0; i < authorizedOrigins.length; i++) {
        const origin = authorizedOrigins[i]
        const originProvider = await getProvider(origin.chainId)
        const originBridgeContract = new ethers.Contract(
          origin.bridge,
          ['function asset() view returns (address)'],
          originProvider
        )
        const originAsset = await originBridgeContract.asset()
        if (assetSymbol === 'WETH') {
          if (originAsset !== ethers.ZeroAddress) {
            console.error(
              `Asset mismatch! The pool expects the wrapped native token but the origin bridge's ${origin.bridge} asset is not the native token!`
            )
            process.exit(1)
          }
        } else {
          if (originAsset === ethers.ZeroAddress) {
            console.error(
              `Asset mismatch! The pool expects ${assetSymbol} but the origin bridge's ${origin.bridge} asset is the native token!`
            )
            process.exit(1)
          }
          const originAssetContract = new ethers.Contract(
            originAsset,
            [
              'function asset() view returns (address)',
              'function symbol() view returns (string)',
            ],
            originProvider
          )
          const originAssetSymbol = await originAssetContract.symbol()
          if (originAssetSymbol !== assetSymbol) {
            console.error(
              `Asset mismatch! The pool expects ${assetSymbol} but the origin bridge's ${origin.bridge} asset is ${originAssetSymbol}`
            )
            process.exit(1)
          }
        }
      }

      // deploy the pool
      console.log({
        asset,
        name,
        symbol,
        origins: JSON.parse(origins),
        yieldPool,
        bridgeFee,
      })
      const tx = await factoryContract.deployPool(
        asset,
        name,
        symbol,
        JSON.parse(origins),
        yieldPool,
        bridgeFee
      )
      const receipt = await tx.wait()
      const event = await getEvent(
        receipt!,
        'PoolDeployed',
        factoryContract.interface
      )

      console.log(`relayPool deployed to: ${await event.args.pool}`)
    }
  )
