import { task } from 'hardhat/config'

import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { networks } from '@relay-protocol/networks'

task('deploy:pool', 'Deploy a relay pool')
  .addParam('asset', 'An ERC20 asset')
  .addOptionalParam('yieldPool', 'A yield pool address')
  .setAction(async ({ asset, yieldPool }, { ethers, ignition }) => {
    const { getStataToken } = await import('@relay-protocol/helpers')

    // get args value
    const { chainId } = await ethers.provider.getNetwork()
    const {
      hyperlaneMailbox,
      name: networkName,
      weth,
    } = networks[chainId.toString()]
    console.log(`deploying on ${networkName} (${chainId})...`)

    // get aave yield pool
    if (!yieldPool) {
      yieldPool = await getStataToken(asset, chainId)
    }

    // parse asset metadata
    const assetContract = await ethers.getContractAt('MyToken', asset)
    const name = `${await assetContract.name()} Relay Pool`
    const symbol = `${await assetContract.symbol()}-REL`

    const origins = []
    // TODO: make programatic (likely fetched from ignition deployments)
    const ORIGIN = {
      chainId: 11155420, // origin chain
      bridge: '0xD26c05a33349a6DeD02DD9360e1ef303d1246fb6', // relayBridge on L2 chain,
      maxDebt: ethers.parseUnits('10000000', 6),
      proxyBridge: '0x4e46Dc422c61d41Ce835234D29e7f9f1C54968Fb', // proxyBridge on local chain (used to claim)
    }
    origins.push(ORIGIN)

    // deploy the pool using ignition
    const parameters = {
      RelayPool: {
        hyperlaneMailbox,
        asset,
        name,
        symbol,
        origins,
        thirdPartyPool: yieldPool,
        weth,
      },
    }
    const { relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
      deploymentId: `RelayPool-${symbol}-${chainId.toString()}`,
    })
    console.log(`relayPool deployed to: ${await relayPool.getAddress()}`)
  })
