import { ethers, ignition } from 'hardhat'
import { networks } from '@relay-protocol/networks'
import CCTPBridgeProxyModule from '../../ignition/modules/CCTPBridgeProxyModule'
import { AbiCoder } from 'ethers'
import { expect } from 'chai'
import { type TransactionReceipt } from 'ethers'
import { CCTPBridgeProxy } from '../../typechain-types'
import {
  getBalance,
  getEvent,
  getCCTPAttestation,
} from '@relay-protocol/helpers'

const {
  bridges: {
    cctp: { messenger, transmitter },
  },
  assets: { usdc: USDC },
} = networks[1]
const recipient = '0x246A13358Fb27523642D86367a51C2aEB137Ac6C'

const amount = ethers.parseUnits('0.1', 6)

describe('CCTPBridgeProxy', function () {
  let bridge: CCTPBridgeProxy
  let receipt: TransactionReceipt | null
  let balanceBefore: bigint
  describe('claim', function () {
    before(async () => {
      // deploy using ignition
      const parameters = {
        CCTPBridgeProxy: {
          messenger,
          transmitter,
          usdc: USDC,
        },
      }

      ;({ bridge } = await ignition.deploy(CCTPBridgeProxyModule, {
        parameters,
      }))

      balanceBefore = await getBalance(recipient, USDC, ethers.provider)

      // bridge tx
      // https://optimistic.etherscan.io/tx/0xcd16cd9c684113ac8060d1f54ad3acd9d5d76730e50474b875d07101636be837
      const { messageBytes, attestation } = await getCCTPAttestation(
        '0xcd16cd9c684113ac8060d1f54ad3acd9d5d76730e50474b875d07101636be837',
        10n
      )

      const claimParams = new AbiCoder().encode(
        ['bytes', 'bytes'],
        [messageBytes, attestation]
      )

      const tx = await bridge.claim(ethers.ZeroAddress, claimParams)
      receipt = await tx.wait()
    })
    it('balance updated correctly', async () => {
      expect(await getBalance(recipient, USDC, ethers.provider)).to.equal(
        balanceBefore + amount
      )
    })
    it('message received correctly', async () => {
      // parse interface to decode logs
      const { interface: iface } = await ethers.getContractAt(
        'IUSDC',
        ethers.ZeroAddress
      )
      const { event: mintEvent } = await getEvent(receipt!, 'Mint', iface)
      expect(mintEvent?.args.amount).to.be.equal(amount)
      expect(mintEvent?.args.to).to.be.equal(recipient)

      const { event: transferEvent } = await getEvent(
        receipt!,
        'Transfer',
        iface
      )
      // expect(transferEvent.value).to.be.equal(amount)
      expect(transferEvent?.args.from).to.be.equal(ethers.ZeroAddress)
      expect(transferEvent?.args.to).to.be.equal(
        '0x246A13358Fb27523642D86367a51C2aEB137Ac6C'
      )
    })
  })
})
