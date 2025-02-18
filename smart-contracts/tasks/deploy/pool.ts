import { task } from 'hardhat/config'
import { AutoComplete, Input } from 'enquirer'
import { networks } from '@relay-protocol/networks'
import { getStataToken, getEvent, getProvider } from '@relay-protocol/helpers'
import { getAddresses } from '@relay-protocol/addresses'

task('deploy:pool', 'Deploy a relay pool')
  .addOptionalParam('name', 'name of the pool')
  .addOptionalParam('symbol', 'symbol of the pool')
  .addOptionalParam('factory', 'Address of the factory')
  .addOptionalParam('asset', 'An ERC20 asset')
  .addOptionalParam('yieldPool', 'A yield pool address')
  .addOptionalParam(
    'origins',
    'Origins, as JSON array: [{"chainId": 11155420, "bridge": "0xD26c05a33349a6DeD02DD9360e1ef303d1246fb6", "maxDebt": 1000000000000, "proxyBridge": "0x4e46Dc422c61d41Ce835234D29e7f9f1C54968Fb"}]'
  )
  .setAction(
    async (
      { name, symbol, factory, asset, yieldPool, origins = '[]' },
      { ethers, run }
    ) => {
      const [user] = await ethers.getSigners()
      const { chainId } = await ethers.provider.getNetwork()
      const { name: networkName, assets } = networks[chainId.toString()]

      console.log(`deploying on ${networkName} (${chainId})...`)

      // pool factory
      if (!factory) {
        const { RelayPoolFactory } = (await getAddresses())[chainId.toString()]
        factory = RelayPoolFactory
      }

      if (!asset) {
        const assetName = await new AutoComplete({
          name: 'asset',
          message:
            'Please choose the asset for your relay bridge (make sure it is supported by the proxy bridge you selected):',
          choices: Object.keys(assets),
        }).run()
        asset = assets[assetName]
      }

      // yield pool
      if (!yieldPool) {
        const yieldPoolName = await new AutoComplete({
          name: 'yieldPoolName',
          message: 'Please choose a yield pool:',
          choices: ['aave', 'dummy'],
        }).run()
        if (yieldPoolName === 'aave') {
          yieldPool = await getStataToken(asset, chainId)
        } else {
          // We need to deploy a dummy yield pool
          yieldPool = await run('deploy:dummy-yield-pool', { asset })
        }
      }

      // parse asset metadata
      const assetContract = await ethers.getContractAt('MyToken', asset)
      const assetName = await assetContract.name()
      const assetSymbol = await assetContract.symbol()

      if (!name) {
        const defaultName = `${assetName} Relay Pool`
        name = await new Input({
          name: 'name',
          message: 'Please enter a pool name:',
          default: defaultName,
        }).run()
      }

      if (!symbol) {
        const defaultSymbol = `${assetSymbol}-REL`
        symbol = await new Input({
          name: 'symbol',
          message: 'Please enter a pool symbol:',
          default: defaultSymbol,
        }).run()
      }

      // Check that the yield pool asset matches
      const yieldPoolContract = await ethers.getContractAt(
        'MyYieldPool',
        yieldPool
      )
      const yieldPoolAsset = await yieldPoolContract.asset()
      if (asset !== yieldPoolAsset) {
        const yeildPoolAssetContract = await ethers.getContractAt(
          'MyToken',
          yieldPoolAsset
        )
        const originAssetSymbol = await yeildPoolAssetContract.symbol()
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
            ['function symbol() view returns (string)'],
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
      const tx = await factoryContract.deployPool(
        asset,
        name,
        symbol,
        JSON.parse(origins),
        yieldPool,
        7 * 24 * 60 * 60
      )
      const receipt = await tx.wait()
      const event = await getEvent(
        receipt!,
        'PoolDeployed',
        factoryContract.interface
      )

      const poolAddress = event.args.pool
      console.log(`relayPool deployed to: ${poolAddress}`)
      let verified = false
      let attempts = 0
      while (!verified) {
        attempts += 1
        await tx.wait(attempts)
        await run('verify:verify', {
          address: poolAddress,
          constructorArguments: [
            await factoryContract.hyperlaneMailbox(),
            asset,
            name,
            symbol,
            authorizedOrigins,
            yieldPool,
            await factoryContract.wrappedEth(),
            await user.getAddress(),
          ],
        })
          .then(() => {
            verified = true
          })
          .catch((e) => {
            if (attempts >= 10) {
              throw e
            }
          })
      }
    }
  )
