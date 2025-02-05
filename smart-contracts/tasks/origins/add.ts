import { task } from 'hardhat/config'
import { Select, Input } from 'enquirer'
import { networks } from '@relay-protocol/networks'
import {
  GET_POOLS_BY_CURATOR,
  GET_RELAY_BRIDGES_BY_NETWORK_AND_ASSET,
  GET_RELAY_POOL,
  RelayVaultService,
} from '@relay-protocol/client'
import { getAddresses } from '../../lib/utils/deployed'

task('pool:add-origin', 'Add origin for a pool')
  .addOptionalParam('l2ChainId', 'the chain id of the L2 network')
  .addOptionalParam('bridge', 'the address of the bridge contract on the L2')
  .addOptionalParam('proxyBridge', 'the origin proxyBridge (on this L1)')
  .addOptionalParam('pool', 'the pool address')
  .addOptionalParam('maxDebt', 'the maximum debt coming from the origin')
  .addOptionalParam('bridgeFee', 'the fee (basis point) applied to this bridge')
  .addOptionalParam('curator', "the curator's address for this origin")
  .addOptionalParam('coolDown', 'the cool down period for this origin')
  .setAction(
    async (
      {
        l2ChainId,
        pool: poolAddress,
        proxyBridge,
        bridge: bridgeAddress,
        maxDebt,
        bridgeFee,
        curator,
        coolDown,
      },
      { ethers, run }
    ) => {
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()
      const { chainId } = await ethers.provider.getNetwork()
      const network = networks[chainId.toString()]
      const vaultService = new RelayVaultService(
        'https://relay-protocol-production.up.railway.app/' // TODO: add to config?
      )

      let pool

      if (!poolAddress) {
        const { relayPools } = await vaultService.query(GET_POOLS_BY_CURATOR, {
          curatorAddress: userAddress,
        })
        if (relayPools.items.length === 0) {
          throw new Error(
            `No pools found curated by ${userAddress} on ${chainId}!`
          )
        }
        const poolName = await new Select({
          message: 'Which pool do you want to add an origin to?',
          choices: relayPools.items.map((pool) => pool.name),
        }).run()
        pool = relayPools.items.find((pool) => pool.name === poolName)
      } else {
        const { relayPool } = await vaultService.query(GET_RELAY_POOL, {
          contractAddress: poolAddress,
        })
        if (relayPool) {
          pool = relayPool
        }
      }

      if (!pool) {
        throw new Error('Pool not found!')
      }

      if (!l2ChainId) {
        // We need to select the L2 chain!
        const possibleL2s = Object.values(networks).filter(
          (network) => network.l1ChainId == chainId
        )
        const l2chainName = await new Select({
          message: 'On what network is this origin?',
          choices: possibleL2s.map((network) => network.name),
        }).run()
        l2ChainId = possibleL2s.find(
          (network) => network.name === l2chainName
        )?.chainId
      }
      const l2Network = networks[l2ChainId.toString()]

      const { BridgeProxy } = (await getAddresses())[chainId.toString()]
      if (!proxyBridge) {
        const bridgeProxyType = await new Select({
          message:
            'From what type of the bridge the funds will be coming from?',
          choices: Object.keys(network.bridges),
        }).run()
        if (!BridgeProxy || !BridgeProxy[bridgeProxyType]) {
          proxyBridge = await run('deploy:bridge-proxy', {
            type: bridgeProxyType,
          })
        } else {
          proxyBridge = BridgeProxy[bridgeProxyType]
        }
      }

      if (!bridgeAddress) {
        let assetName
        Object.keys(network.assets).forEach((name) => {
          if (network.assets[name].toLowerCase() === pool.asset.toLowerCase()) {
            assetName = name
          }
        })
        let l2AssetAddress
        if (assetName === 'weth') {
          l2AssetAddress = ethers.ZeroAddress
        } else {
          l2AssetAddress = l2Network.assets[assetName]
        }
        // And now let's get the
        // Ok, let's list all the bridges we have!
        const { relayBridges } = await vaultService.query(
          GET_RELAY_BRIDGES_BY_NETWORK_AND_ASSET,
          {
            assetAddress: l2AssetAddress,
            chainId: Number(l2ChainId), // This is the origin chain (L2)
          }
        )
        if (relayBridges.items.length === 0) {
          throw new Error(
            `No bridge found for ${assetName} on ${l2Network.name}!`
          )
        } else if (relayBridges.items.length === 1) {
          bridgeAddress = relayBridges.items[0].contractAddress
        } else {
          // TODO: Ask user to chose
          bridgeAddress = relayBridges.items[0].contractAddress
        }
      }

      let decimals = 18n
      if (pool.asset !== ethers.ZeroAddress) {
        const asset = await ethers.getContractAt('MyToken', pool.asset)
        decimals = await asset.decimals()
      }

      if (!maxDebt) {
        const maxDebtInDecimals = await new Input({
          message: 'What is the maximum debt for this origin?',
        }).run()
        maxDebt = ethers.parseUnits(maxDebtInDecimals, decimals)
      }

      if (!bridgeFee) {
        bridgeFee = await new Input({
          message: 'What is the bridge fee, in basis points?',
          default: 10,
        }).run()
      }
      const relayPool = await ethers.getContractAt(
        'RelayPool',
        pool.contractAddress
      )

      if (!curator) {
        const poolCurator = await relayPool.owner()
        curator = await new Input({
          message:
            "Who should be curator for that origin? They can instantly suspend the origin. (default is the pool's curator)",
          default: poolCurator,
        }).run()
      }

      if (!coolDown) {
        coolDown = await new Input({
          message:
            'Who should the the shortest delay between a bridge initiation and the actual transfer from the pool? (in seconds)',
          default: 60 * 30, // 30 minutes
        }).run()
      }

      const tx = await relayPool.addOrigin({
        chainId: l2ChainId,
        bridge: bridgeAddress,
        proxyBridge,
        maxDebt,
        bridgeFee,
        curator,
        coolDown,
      })
      console.log('Adding origin...')
      await tx.wait()
      console.log('Origin added!')
    }
  )
