import { ethers, ignition } from 'hardhat'
import { expect } from 'chai'
import { parseUnits, TransactionReceipt, type Signer } from 'ethers'
import { mintUSDC } from '../utils/hardhat'
import { getBalance, getEvent } from '../../lib/utils'
import { networks } from '@relay-protocol/networks'
import { reverts } from '../utils/errors'

import { CCTPBridgeProxy } from '../../typechain-types'
import CCTPBridgeProxyModule from '../../ignition/modules/CCTPBridgeProxyModule'

const chainId = 10
const destinationChainId = 1
const {
  udt: UDT,
  usdc: { token: USDC, messenger, transmitter },
} = networks[chainId]

describe('CCTPBridgeProxy', function () {
  let bridge: CCTPBridgeProxy
  let recipient: Signer

  before(async () => {
    ;[, recipient] = await ethers.getSigners()

    // deploy using ignition
    const parameters = {
      CCTPBridgeProxy: {
        messenger,
        transmitter,
        usdc: USDC,
      },
    }
    ;({ bridge } = await ignition.deploy(CCTPBridgeProxyModule, { parameters }))

    // const CCTPBridgeProxy = await ethers.getContractFactory('CCTPBridgeProxy')
    // setup all cctp domains
    // bridge = await CCTPBridgeProxy.deploy(messenger, transmitter, USDC)
  })

  describe('errors', () => {
    it('fails if using sth that is not USDC', async () => {
      await reverts(
        bridge.bridge(
          await recipient.getAddress(),
          destinationChainId,
          await recipient.getAddress(),
          UDT,
          parseUnits('100', 6),
          '0x' //empty data
        ),
        'TOKEN_NOT_BRIDGED'
      )
    })
  })
  describe('sending usdc', () => {
    let balanceBefore: bigint
    const amount = parseUnits('100', 6)
    let receipt: TransactionReceipt | null

    before(async () => {
      // get some usdc
      await mintUSDC(USDC, await recipient.getAddress(), amount)
      balanceBefore = await getBalance(await recipient.getAddress(), USDC)
      expect(balanceBefore).to.be.equal(amount)

      // approve bridge to manipulate our usdc tokens
      const usdc = await ethers.getContractAt('IUSDC', USDC)
      await usdc.connect(recipient).approve(await bridge.getAddress(), amount)

      // send message to the bridge
      const tx = await bridge.bridge(
        await recipient.getAddress(),
        destinationChainId,
        await recipient.getAddress(),
        USDC,
        amount,
        '0x' //empty data
      )

      receipt = await tx.wait()
    })
    it('burnt the balance', async () => {
      expect(await getBalance(await recipient.getAddress(), USDC)).to.be.equal(
        balanceBefore - amount
      )
    })

    it('burn event is emitted correctly', async () => {
      // parse interface to decode logs
      const { interface: iface } = await ethers.getContractAt(
        'ITokenMessenger',
        ethers.ZeroAddress
      )
      const { event } = await getEvent(receipt!, 'DepositForBurn', iface)
      expect(event).to.not.be.equal(undefined)
      const { args } = event
      expect(args?.burnToken).to.be.equal(USDC)
      expect(args?.amount).to.be.equal(amount)
      expect(args?.destinationDomain).to.be.equal(
        networks[destinationChainId].usdc.domain
      )
      // expect(args?.mintRecipient).to.be.equal(await recipient.getAddress())
    })

    it('message transmitter send message correctly', async () => {
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
