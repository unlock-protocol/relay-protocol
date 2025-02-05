import { getBalance, checkAllowance, getEvent } from '@relay-protocol/helpers'
import { Mailbox } from '@relay-protocol/helpers/abis'
import { Select, Input } from 'enquirer'

import { task } from 'hardhat/config'
import { getBalance, checkAllowance } from '@relay-protocol/helpers'
import { networks } from '@relay-protocol/networks'
import {
  GET_ORIGINS_WITH_BRIDGE,
  GET_RELAY_BRIDGES_BY_NETWORK_AND_ASSET,
  RelayVaultService,
} from '@relay-protocol/client'

task('bridge:send', 'Send tokens to a pool across a relay bridge')
  .addOptionalParam('asset', 'The address of the asset you want to bridge')
  .addOptionalParam('bridge', 'The Relay Bridge contract address')
  .addOptionalParam('pool', 'Pool address on destination chain')
  .addOptionalParam('amount', 'the amount of tokens to send')
  .addOptionalParam('recipient', 'The recipient of the funds (default to self)')
  .addOptionalParam(
    'destChain',
    'the id of destination chain (default to eth mainnet)'
  )
  .setAction(
    async (
      {
        asset: assetAddress,
        bridge: bridgeAddress,
        pool: poolAddress,
        amount,
        recipient,
        destChain = 11155111,
      },
      { ethers: rawEthers, zksyncEthers }
    ) => {
      const { chainId } = await rawEthers.provider.getNetwork()
      const net = networks[chainId.toString()]
      const ethers = net.isZksync ? zksyncEthers : rawEthers

      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()

      if (!net) {
        throw Error(
          `Unsupported network ${chainId}. Please add it to networks.ts`
        )
      }
      const { assets, l1ChainId } = net

      if (!assetAddress) {
        const asset = await new Select({
          name: 'asset',
          message: 'Please choose the asset you want to bridge:',
          choices: ['native', ...Object.keys(assets)],
        }).run()
        if (asset === 'native') {
          assetAddress = rawEthers.ZeroAddress
        } else {
          assetAddress = assets[asset]
        }
      }

      const vaultService = new RelayVaultService(
        'https://relay-protocol-production.up.railway.app/' // TODO: add to config?
      )

      if (!bridgeAddress) {
        // List bridges using the backend
        const { relayBridges } = await vaultService.query(
          GET_RELAY_BRIDGES_BY_NETWORK_AND_ASSET,
          {
            assetAddress,
            chainId: Number(chainId), // This is the origin chain (L2)
          }
        )
        if (relayBridges.items.length === 0) {
          throw new Error(
            `No pools found curated by ${userAddress} on ${chainId}!`
          )
        } else if (relayBridges.items.length === 1) {
          bridgeAddress = relayBridges.items[0].contractAddress
        } else {
          bridgeAddress = await new Select({
            name: 'bridgeAddress',
            message: 'Multiple bridges found. Please choose one:',
            choices: relayBridges.items.map((bridge) => bridge.contractAddress),
          }).run()
        }
      }

      if (!poolAddress) {
        const { poolOrigins } = await vaultService.query(
          GET_ORIGINS_WITH_BRIDGE,
          {
            originChainId: Number(chainId),
            originBridge: bridgeAddress,
          }
        )
        if (poolOrigins.items.length === 0) {
          throw new Error('No pools found that uses this bridge as an origin!')
        } else if (poolOrigins.items.length === 1) {
          poolAddress = poolOrigins.items[0].pool.contractAddress
        } else {
          poolAddress = await new Select({
            name: 'poolAddress',
            message: 'Multiple pools found. Please choose one:',
            choices: poolOrigins.items.map(
              (origin) => origin.pool.contractAddress
            ),
          }).run()
        }
      }

      let decimals = 18n
      if (assetAddress !== rawEthers.ZeroAddress) {
        const asset = await ethers.getContractAt('MyToken', assetAddress)
        decimals = await asset.decimals()
      }

      if (!amount) {
        const amountInDecimals = await new Input({
          name: 'amount',
          message: 'How much do you want to bridge?',
          default: '0.1',
        }).run()
        amount = ethers.parseUnits(amountInDecimals, decimals)
      }

      // parse default values
      if (!recipient) recipient = userAddress

      // TODO: check balance on pool as well and warn if insufficient balance on the pool!

      // check balance
      const balance = await getBalance(
        userAddress,
        assetAddress,
        ethers.provider
      )
      if (balance < amount) {
        throw Error(
          `Insufficient balance (actual: ${balance}, expected: ${amount})`
        )
      }

      // check allowance
      if (assetAddress != rawEthers.ZeroAddress) {
        const asset = await ethers.getContractAt('MyToken', assetAddress)
        await checkAllowance(asset, bridgeAddress, amount, userAddress)
      }

      // TODO: estimate fee correctly
      const hyperlaneFee = ethers.parseEther('0.01')
      const value =
        assetAddress === rawEthers.ZeroAddress
          ? BigInt(amount) + hyperlaneFee
          : hyperlaneFee

      const bridge = await ethers.getContractAt('RelayBridge', bridgeAddress)
      const tx = await bridge.bridge(
        amount,
        recipient,
        destChain, // chain
        poolAddress,
        {
          value,
          gasLimit: 25000000,
        }
      )

      // TODO: parse tx results
      const receipt = await tx.wait()

      const event = await getEvent(
        receipt!,
        'DispatchId',
        new ethers.Interface(Mailbox)
      )
      const dispatchId = event.args[0].substring(2)

      console.log(
        `Tx. ${tx.hash}. \nHyperlane message: https://explorer.hyperlane.xyz/message/${dispatchId} `
      )
    }
  )

task('bridge:send-proxy', 'Send tokens across a proxy bridge (test purposes)')
  // .addParam('asset', 'The ERC20 asset to deposit')
  .addParam('bridge', 'The bridge contract address')
  .addParam('amount', 'the amount of tokens to send')
  .addOptionalParam(
    'destChain',
    'the id of destination chain (default to eth mainnet)'
  )
  .addOptionalParam('asset', 'the asset to send (default to native)')
  .addOptionalParam('recipient', 'The recipient of the funds (default to self)')
  .setAction(
    async (
      {
        bridge: bridgeAddress,
        amount,
        destChain,
        asset: assetAddress,
        recipient,
      },
      { ethers: rawEthers, zksyncEthers }
    ) => {
      const { chainId } = await rawEthers.provider.getNetwork()
      const { isZksync } = networks[chainId.toString()]
      const ethers = isZksync ? zksyncEthers : rawEthers
      const bridge = await ethers.getContractAt('BridgeProxy', bridgeAddress)
      const [user] = await ethers.getSigners()
      const userAddress = await user.getAddress()

      // parse default values
      if (!assetAddress) assetAddress = ethers.ZeroAddress
      if (!recipient) recipient = userAddress
      if (!destChain) destChain = 1

      // check balance
      const balance = await getBalance(
        userAddress,
        assetAddress,
        ethers.provider
      )
      if (balance < amount) {
        throw Error(
          `Insufficient balance (actual: ${balance}, expected: ${amount})`
        )
      }

      // check allowance
      if (assetAddress != ethers.ZeroAddress) {
        const asset = await ethers.getContractAt('MyToken', assetAddress)
        await checkAllowance(asset, bridgeAddress, amount, userAddress)
      }

      // send tx
      const tx = await bridge.bridge(
        userAddress, // sender
        destChain, // destinationChainId,
        recipient, // recipient
        assetAddress, // asset
        amount, // amount
        '0x', // data
        {
          value: assetAddress === ethers.ZeroAddress ? amount : 0,
        }
      )

      // parse tx results
      const receipt = await tx.wait()
      console.log(receipt?.logs)
      // TODO: check for AssetsDepositedIntoYieldPool or similar
      // const event = await getEvent(receipt, 'MessagePassed')
    }
  )
