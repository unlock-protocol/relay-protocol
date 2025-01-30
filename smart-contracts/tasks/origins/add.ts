import { task } from 'hardhat/config'

import { networks } from '@relay-protocol/networks'
import { RelayVaultService } from '@relay-protocol/client'

task('pool:add-origin', 'Add origin for a pool').setAction(
  async ({}, { ethers }) => {
    // get args value
    const { chainId } = await ethers.provider.getNetwork()
    const network = networks[chainId.toString()]
    const vaultService = new RelayVaultService(
      'https://relay-pools-backend-production.up.railway.app/' // TODO: add to config?
    )
    const { data } = await vaultService.query(GET_ALL_POOLS)

    // Let's get all the pool for which we are a curator!

    // // get aave yield pool
    // if (!yieldPool) {
    //   yieldPool = await getStataToken(asset, chainId)
    // }

    // // parse asset metadata
    // const assetContract = await ethers.getContractAt('MyToken', asset)
    // const assetSymbol = await assetContract.symbol()
    // const name = `${await assetContract.name()} Relay Pool`
    // const symbol = `${assetSymbol}-REL`

    // // Check that the yield pool asset matche's
    // const yieldPoolContract = await ethers.getContractAt(
    //   'MyYieldPool',
    //   yieldPool
    // )
    // const yieldPoolAsset = await yieldPoolContract.asset()
    // if (asset !== yieldPoolAsset) {
    //   const yeildPoolAssetContract = await ethers.getContractAt(
    //     'MyToken',
    //     yieldPoolAsset
    //   )
    //   const originAssetSymbol = await yeildPoolAssetContract.symbol()
    //   console.error(
    //     `Asset mismatch! The pool expects a different asset (${assetSymbol}) than the yield pool (${originAssetSymbol})!`
    //   )
    //   process.exit(1)
    // }

    // const factoryContract = await ethers.getContractAt(
    //   'RelayPoolFactory',
    //   factory
    // )

    // // Check that each origin's asset matches
    // // We need to check the symbols...
    // const authorizedOrigins = JSON.parse(origins)
    // if (authorizedOrigins.length === 0) {
    //   console.error('No authorized origins provided!')
    //   process.exit(1)
    // }
    // for (let i = 0; i < authorizedOrigins.length; i++) {
    //   const origin = authorizedOrigins[i]
    //   const originProvider = await ethers.getDefaultProvider(origin.chainId)
    //   const originBridgeContract = new ethers.Contract(
    //     origin.bridge,
    //     ['function asset() view returns (address)'],
    //     originProvider
    //   )
    //   const originAsset = await originBridgeContract.asset()
    //   if (assetSymbol === 'WETH') {
    //     if (originAsset !== ethers.ZeroAddress) {
    //       console.error(
    //         `Asset mismatch! The pool expects the wrapped native token but the origin bridge's ${origin.bridge} asset is not the native token!`
    //       )
    //       process.exit(1)
    //     }
    //   } else {
    //     if (originAsset === ethers.ZeroAddress) {
    //       console.error(
    //         `Asset mismatch! The pool expects ${assetSymbol} but the origin bridge's ${origin.bridge} asset is the native token!`
    //       )
    //       process.exit(1)
    //     }
    //     const originAssetContract = new ethers.Contract(
    //       originAsset,
    //       ['function asset() view returns (address)'],
    //       originProvider
    //     )
    //     const originAssetSymbol = await originAssetContract.symbol()
    //     if (originAssetSymbol !== assetSymbol) {
    //       console.error(
    //         `Asset mismatch! The pool expects ${assetSymbol} but the origin bridge's ${origin.bridge} asset is ${originAssetSymbol}`
    //       )
    //       process.exit(1)
    //     }
    //   }
    // }

    // // deploy the pool
    // const tx = await factoryContract.deployPool(
    //   asset,
    //   name,
    //   symbol,
    //   JSON.parse(origins),
    //   yieldPool
    // )
    // const receipt = await tx.wait()
    // const event = await getEvent(
    //   receipt!,
    //   'PoolDeployed',
    //   factoryContract.interface
    // )

    // console.log(`relayPool deployed to: ${await event.args.pool}`)
  }
)
