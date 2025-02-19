import { ethers, ignition } from 'hardhat'
import { expect } from 'chai'
import { mintUSDC, stealERC20 } from '../utils/hardhat'
import { getEvent } from '@relay-protocol/helpers'

import { Mailbox, ERC20 } from '@relay-protocol/helpers/abis'
import { ContractTransactionReceipt, Log } from 'ethers'

import { networks } from '@relay-protocol/networks'
import RelayBridgeModule from '../../ignition/modules/RelayBridgeModule'
import OPStackNativeBridgeProxyModule from '../../ignition/modules/OPStackNativeBridgeProxyModule'
import CCTPBridgeProxyModule from '../../ignition/modules/CCTPBridgeProxyModule'

const {
  hyperlaneMailbox: HYPERLANE_MAILBOX_ON_OPTIMISM,
  bridges: {
    cctp: { transmitter, messenger },
  },
  assets,
} = networks[10]

const relayPool = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const l1BridgeProxy = '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1'

describe('RelayBridge', function () {
  it('should work for the base sequence using ETH', async () => {
    const [user] = await ethers.getSigners()

    const { bridge: opProxyBridge } = await ignition.deploy(
      OPStackNativeBridgeProxyModule,
      {
        parameters: {
          OPStackNativeBridgeProxy: {
            portalProxy: ethers.ZeroAddress,
            replayPoolChainId: 1,
            relayPool,
            l1BridgeProxy,
          },
        },
      }
    )
    const opProxyBridgeAddress = await opProxyBridge.getAddress()

    const parameters = {
      RelayBridge: {
        asset: ethers.ZeroAddress,
        bridgeProxy: opProxyBridgeAddress,
        hyperlaneMailbox: HYPERLANE_MAILBOX_ON_OPTIMISM,
      },
    }
    const { bridge } = await ignition.deploy(RelayBridgeModule, {
      parameters,
    })

    const bridgeAddress = await bridge.getAddress()
    const recipient = await user.getAddress()
    const amount = ethers.parseEther('1')
    const poolAddress = '0x1Bd1dc30F238541D4CAb3Ba0aB766e9eB57050eb'
    const nonce = await bridge.transferNonce()
    const tx = await bridge.bridge(
      amount,
      recipient,
      1, // chain
      poolAddress,
      {
        value: amount * 2n,
        gasLimit: 30000000,
      }
    )
    const receipt = await tx.wait()

    expect(receipt.logs.length).to.equal(10)
    receipt.logs.forEach((log: Log) => {
      expect(log.address).to.be.oneOf([
        '0x4200000000000000000000000000000000000016', // L2ToL1MessagePasser
        '0x4200000000000000000000000000000000000007', // L2CrossDomainMessenger
        '0x4200000000000000000000000000000000000010', // L2StandardBridge
        HYPERLANE_MAILBOX_ON_OPTIMISM,
        '0x68eE9bec9B4dbB61f69D9D293Ae26a5AACb2e28f', // Merkle Tree Hook https://docs.hyperlane.xyz/docs/reference/contract-addresses#merkle-tree-hook
        '0xD8A76C4D91fCbB7Cc8eA795DFDF870E48368995C', // Interchain Gas Paymaster https://docs.hyperlane.xyz/docs/reference/contract-addresses#interchain-gas-paymaster-hook
        bridgeAddress,
      ])
      if (log.address === HYPERLANE_MAILBOX_ON_OPTIMISM) {
        // L2ToL1MessagePasser
        const iface = new ethers.Interface(Mailbox)
        const event = iface.parseLog(log)

        expect(event.name).to.be.oneOf(['Dispatch', 'DispatchId'])
        if (event.name === 'Dispatch') {
          expect(event.name).to.equal('Dispatch')
          // sender
          expect(event.args[0]).to.equal(bridgeAddress)
          // destination
          expect(event.args[1]).to.equal(1) // Ethereum mainnet
          // recipient  https://docs.hyperlane.xyz/docs/reference/messaging/receive#handle
          const poolAddressPadded =
            '0x' +
            poolAddress.replace(/^0x/, '').toLowerCase().padStart(64, '0')
          expect(event.args[2]).to.equal(poolAddressPadded)
          // message TODO: decode
          // expect(event.args[3]).to.equal(
          //   "0x030009ae080000000a000000000000000000000000114e375b6fcc6d6fcb68c7a1d407e652c54f25fb000000010000000000000000000000001bd1dc30f238541d4cab3ba0ab766e9eb57050eb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000de0b6b3a7640000"
          // );
        } else if (event.name === 'DispatchId') {
          expect(event.name).to.equal('DispatchId')
          // DispatchId
          // expect(event.args[0]).to.equal(
          //   "0x240ecaebb0f12af10b28a937771240b355dbc5e2c14fda63e2507ff4e9a598eb"
          // );
        }
      } else if (log.address === bridgeAddress) {
        const event = bridge.interface.parseLog(log)
        expect(event.name).to.equal('BridgeInitiated')
        expect(event.args[0]).to.equal(nonce)
        expect(event.args[1]).to.equal(recipient)
        expect(event.args[2]).to.equal(recipient)
        expect(event.args[3]).to.equal(ethers.ZeroAddress)
        expect(event.args[4]).to.equal(amount)
        expect(event.args[5]).to.equal(1)
        expect(event.args[6]).to.equal(poolAddress)
      }
    })
  })

  it('should work for the base sequence using an ERC20', async () => {
    const [user] = await ethers.getSigners()

    const opProxyBridge = await ethers.deployContract(
      'OPStackNativeBridgeProxy',
      [ethers.ZeroAddress]
    )
    const opProxyBridgeAddress = await opProxyBridge.getAddress()

    const bridge = await ethers.deployContract('RelayBridge', [
      assets.udt,
      opProxyBridgeAddress,
      HYPERLANE_MAILBOX_ON_OPTIMISM,
    ])
    const bridgeAddress = await bridge.getAddress()
    const recipient = await user.getAddress()
    const amount = ethers.parseEther('1')
    const poolAddress = '0x1Bd1dc30F238541D4CAb3Ba0aB766e9eB57050eb'

    // Transfer UDT to sender/recipient
    await stealERC20(
      assets.udt,
      '0x99b1348a9129ac49c6de7F11245773dE2f51fB0c',
      recipient,
      amount
    )

    // Approve
    const erc20Contract = await ethers.getContractAt(ERC20, assets.udt)
    await erc20Contract.approve(bridgeAddress, amount)

    const nonce = await bridge.transferNonce()

    const tx = await bridge.bridge(
      amount,
      recipient,
      1, // chain
      poolAddress,
      {
        value: amount * 2n,
        gasLimit: 30000000,
      }
    )
    const receipt = await tx.wait()

    expect(receipt.logs.length).to.equal(14)
    receipt.logs.forEach((log: Log) => {
      expect(log.address).to.be.oneOf([
        '0x4200000000000000000000000000000000000016', // L2ToL1MessagePasser
        '0x4200000000000000000000000000000000000007', // L2CrossDomainMessenger
        '0x4200000000000000000000000000000000000010', // L2StandardBridge
        HYPERLANE_MAILBOX_ON_OPTIMISM,
        '0x68eE9bec9B4dbB61f69D9D293Ae26a5AACb2e28f', // Merkle Tree Hook https://docs.hyperlane.xyz/docs/reference/contract-addresses#merkle-tree-hook
        '0xD8A76C4D91fCbB7Cc8eA795DFDF870E48368995C', // Interchain Gas Paymaster https://docs.hyperlane.xyz/docs/reference/contract-addresses#interchain-gas-paymaster-hook
        bridgeAddress,
        assets.udt,
      ])
      if (log.address === HYPERLANE_MAILBOX_ON_OPTIMISM) {
        // L2ToL1MessagePasser
        const iface = new ethers.Interface(Mailbox)
        const event = iface.parseLog(log)

        expect(event.name).to.be.oneOf(['Dispatch', 'DispatchId'])
        if (event.name === 'Dispatch') {
          expect(event.name).to.equal('Dispatch')
          // sender
          expect(event.args[0]).to.equal(bridgeAddress)
          // destination
          expect(event.args[1]).to.equal(1) // Ethereum mainnet
          // recipient  https://docs.hyperlane.xyz/docs/reference/messaging/receive#handle
          const poolAddressPadded =
            '0x' +
            poolAddress.replace(/^0x/, '').toLowerCase().padStart(64, '0')
          expect(event.args[2]).to.equal(poolAddressPadded)
          // message TODO: decode
          // expect(event.args[3]).to.equal(
          //   "0x030009ae080000000a000000000000000000000000114e375b6fcc6d6fcb68c7a1d407e652c54f25fb000000010000000000000000000000001bd1dc30f238541d4cab3ba0ab766e9eb57050eb0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000de0b6b3a7640000"
          // );
        } else if (event.name === 'DispatchId') {
          expect(event.name).to.equal('DispatchId')
          // DispatchId
          // expect(event.args[0]).to.equal(
          //   "0x13405d896bfb8534ccf928a9f654918d59f5937d938ef7179630fe721e587404"
          // );
        }
      } else if (log.address === bridgeAddress) {
        const event = bridge.interface.parseLog(log)
        expect(event.name).to.equal('BridgeInitiated')
        expect(event.args[0]).to.equal(nonce)
        expect(event.args[1]).to.equal(recipient)
        expect(event.args[2]).to.equal(recipient)
        expect(event.args[3]).to.equal(assets.udt)
        expect(event.args[4]).to.equal(amount)
        expect(event.args[5]).to.equal(1)
        expect(event.args[6]).to.equal(poolAddress)
      }
    })
  })

  describe('should work for the base sequence using USDC', () => {
    let receipt: ContractTransactionReceipt
    const amount = ethers.parseUnits('10', 6)

    before(async () => {
      const [user] = await ethers.getSigners()
      // deploy using ignition
      const parameters = {
        CCTPBridgeProxy: {
          messenger,
          transmitter,
          usdc: assets.usdc,
        },
      }
      const { bridge: cctpProxyBridge } = await ignition.deploy(
        CCTPBridgeProxyModule,
        {
          parameters,
        }
      )
      const cctpProxyBridgeAddress = await cctpProxyBridge.getAddress()
      const bridge = await ethers.deployContract('RelayBridge', [
        assets.usdc,
        cctpProxyBridgeAddress,
        HYPERLANE_MAILBOX_ON_OPTIMISM,
      ])

      const bridgeAddress = await bridge.getAddress()
      const recipient = await user.getAddress()

      const poolAddress = '0x1Bd1dc30F238541D4CAb3Ba0aB766e9eB57050eb'

      // Get some USDC to sender/recipient
      await mintUSDC(assets.usdc, recipient, amount)

      // Approve
      const erc20Contract = await ethers.getContractAt(ERC20, assets.usdc)
      await erc20Contract.approve(bridgeAddress, amount)

      const nonce = await bridge.transferNonce()
      const tx = await bridge.bridge(
        amount,
        recipient,
        1, // chain
        poolAddress,
        {
          value: ethers.parseEther('0.02'), // mailbox fee
          gasLimit: 30000000,
        }
      )
      receipt = await tx.wait()
      expect(receipt.logs.length).to.equal(12)
    })

    it('fire CCTP DepositForBurn event', async () => {
      // parse interface to decode logs
      const { interface: iface } = await ethers.getContractAt(
        'ITokenMessenger',
        ethers.ZeroAddress
      )
      const { event } = await getEvent(receipt!, 'DepositForBurn', iface)
      expect(event).to.not.be.equal(undefined)
      const { args } = event
      expect(args?.burnToken).to.be.equal(networks[10].assets.usdc)
      expect(args?.amount).to.be.equal(amount)
      expect(args?.destinationDomain).to.be.equal(
        networks[1].bridges.cctp.domain
      )
    })

    it('fire MessageSent event', async () => {
      // parse interface to decode logs
      const { interface: iface } = await ethers.getContractAt(
        'IMessageTransmitter',
        ethers.ZeroAddress
      )
      const { event } = await getEvent(receipt!, 'MessageSent', iface)
      expect(event).to.not.be.equal(undefined)
      expect(event?.args.message).to.not.be.equal(undefined)
    })
  })
})
