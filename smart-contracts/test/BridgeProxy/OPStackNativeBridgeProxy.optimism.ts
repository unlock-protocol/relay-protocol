import { ethers, ignition } from 'hardhat'
import {
  L2CrossDomainMessenger,
  L2ToL1MessagePasserAbi,
  L2StandardBridge,
  ERC20_ABI,
} from '@relay-protocol/helpers/abis'
import { expect } from 'chai'
import { stealERC20 } from '../utils/hardhat'
import { networks } from '@relay-protocol/networks'
import OPStackNativeBridgeProxyModule from '../../ignition/modules/OPStackNativeBridgeProxyModule'

import { AbiCoder, Log } from 'ethers'
const { udt: UDT, op } = networks[1]
const { udt: UDT_OPTIMISM } = networks[10]

describe('OPStackNativeBridgeProxy', function () {
  describe('bridge', function () {
    it('should work for the base sequence using ETH', async () => {
      const [user] = await ethers.getSigners()

      // deploy
      const parameters = {
        OPStackNativeBridgeProxy: {
          portalProxy: op.portalProxy,
        },
      }
      const { bridge } = await ignition.deploy(OPStackNativeBridgeProxyModule, {
        parameters,
      })
      const bridgeAddress = await bridge.getAddress()

      const recipient = await user.getAddress()
      const amount = ethers.parseEther('1')

      const crossDomainMessenger = new ethers.Contract(
        '0x4200000000000000000000000000000000000007',
        L2CrossDomainMessenger,
        user
      )
      const crossDomainMessengerNextNonce =
        await crossDomainMessenger.messageNonce()

      const l2ToL1MessagePasser = new ethers.Contract(
        '0x4200000000000000000000000000000000000016',
        L2ToL1MessagePasserAbi,
        user
      )
      const l2ToL1MessagePasserNextNonce =
        await l2ToL1MessagePasser.messageNonce()

      const tx = await bridge.bridge(
        recipient,
        1, // chain
        recipient,
        ethers.ZeroAddress,
        amount,
        '0x',
        {
          value: amount,
          gasLimit: 30000000,
        }
      )
      const receipt = await tx.wait()

      expect(receipt.logs.length).to.equal(5)

      receipt.logs.forEach((log: Log) => {
        expect(log.address).to.be.oneOf([
          '0x4200000000000000000000000000000000000016',
          '0x4200000000000000000000000000000000000007',
          '0x4200000000000000000000000000000000000010',
        ])
        if (log.address === '0x4200000000000000000000000000000000000016') {
          // L2ToL1MessagePasser
          const iface = new ethers.Interface(L2ToL1MessagePasserAbi)
          const event = iface.parseLog(log)
          expect(event.name).to.equal('MessagePassed')
          // nonce
          expect(event.args[0]).to.equal(l2ToL1MessagePasserNextNonce)
          // sender (L2CrossDomainMessenger)
          expect(event.args[1]).to.equal(
            '0x4200000000000000000000000000000000000007'
          )
          // target (L1CrossDomainMessengerProxy)
          expect(event.args[2]).to.equal(
            '0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1'
          )
          // value
          expect(event.args[3]).to.equal(amount)
          // gasLimit
          expect(event.args[4]).to.equal(490798)
          // data
          const [nonce, sender, target, value, minGasLimit, message] =
            new ethers.Interface(L2CrossDomainMessenger).decodeFunctionData(
              'relayMessage',
              event.args[5]
            )
          expect(nonce).to.equal(crossDomainMessengerNextNonce)
          expect(sender).to.equal('0x4200000000000000000000000000000000000010') // STANDARD_BRIDGE
          expect(target).to.equal('0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1') // L1StandardBridgeProxy
          expect(value).to.equal(amount)
          expect(minGasLimit).to.equal(200000n)

          // parse the message
          const [relayFrom, relayTo, relayAmount, extraData] =
            new ethers.Interface(L2StandardBridge).decodeFunctionData(
              'finalizeBridgeETH',
              message
            )

          expect(relayFrom).to.equal(bridgeAddress)
          expect(relayTo).to.equal(recipient)
          expect(relayAmount).to.equal(amount)
          expect(extraData).to.equal('0x')

          // withdrawalHash
          const withdrawalHash = ethers.keccak256(
            new AbiCoder().encode(
              ['uint256', 'address', 'address', 'uint256', 'uint256', 'bytes'],
              [
                event.args[0],
                event.args[1],
                event.args[2],
                event.args[3],
                event.args[4],
                event.args[5],
              ]
            )
          )
          expect(event.args[6]).to.equal(withdrawalHash)
        } else if (
          log.address === '0x4200000000000000000000000000000000000007'
        ) {
          // L2CrossDomainMessenger
          const iface = new ethers.Interface(L2CrossDomainMessenger)
          const event = iface.parseLog(log)
          expect(event.name).to.be.oneOf([
            'SentMessage',
            'SentMessageExtension1',
          ])
          if (event.name === 'SentMessage') {
            // target (L1StandardBridgeProxy)
            expect(event.args[0]).to.equal(
              '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1'
            )
            // sender
            expect(event.args[1]).to.equal(
              '0x4200000000000000000000000000000000000010'
            )
            // message : TODO: parse
            // expect(event.args[2]).to.equal(
            //   '0x1635f5fd00000000000000000000000067ad6ea566ba6b0fc52e97bc25ce46120fdac04c000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000'
            // )
            // messageNonce
            expect(event.args[3]).to.greaterThan(
              '1766847064778384329583297500742918515827483896875618958121606201292642353'
            )
            // gasLimit
            expect(event.args[4]).to.equal('200000')
          } else if (event.name === 'SentMessageExtension1') {
            // sender
            expect(event.args[0]).to.equal(
              '0x4200000000000000000000000000000000000010'
            )
            // value
            expect(event.args[1]).to.equal(ethers.parseEther('1'))
          }
        } else if (
          log.address === '0x4200000000000000000000000000000000000010'
        ) {
          const iface = new ethers.Interface(L2StandardBridge)
          const event = iface.parseLog(log)
          expect(event.name).to.be.oneOf([
            'WithdrawalInitiated',
            'ETHBridgeInitiated',
          ])
          if (event.name === 'WithdrawalInitiated') {
            // l1Token
            expect(event.args[0]).to.equal(
              '0x0000000000000000000000000000000000000000' // Native token
            )
            // l2Token
            expect(event.args[1]).to.equal(
              '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' // ERC-20: : Ether
            )
            // From
            expect(event.args[2]).to.equal(bridgeAddress)
            // To
            expect(event.args[3]).to.equal(recipient)
            // Amount
            expect(event.args[4]).to.equal(amount)
            // ExtraData
            expect(event.args[5]).to.equal('0x')
          } else if (event.name === 'ETHBridgeInitiated') {
            // from
            expect(event.args[0]).to.equal(bridgeAddress)
            // to
            expect(event.args[1]).to.equal(recipient)
            // amount
            expect(event.args[2]).to.equal(amount)
            // extraData
            expect(event.args[3]).to.equal('0x')
          }
        }
      })
    })

    it('should work for the base sequence using ERC20', async () => {
      // We use UDT for example as it has already been bridged to OP
      const [user] = await ethers.getSigners()

      const Bridge = await ethers.getContractFactory('OPStackNativeBridgeProxy')
      const bridge = await Bridge.deploy(op.portalProxy)
      const bridgeAddress = await bridge.getAddress()

      const recipient = await user.getAddress()
      const amount = ethers.parseEther('1') // 1 UDT
      // Transfer UDT to sender/recipient
      await stealERC20(
        UDT_OPTIMISM,
        '0x99b1348a9129ac49c6de7F11245773dE2f51fB0c',
        recipient,
        amount
      )

      // Approve
      const erc20Contract = await ethers.getContractAt(ERC20_ABI, UDT_OPTIMISM)
      await erc20Contract.approve(bridgeAddress, amount)

      const tx = await bridge.bridge(
        recipient, // recipient
        1, // chain
        recipient, // sender
        UDT_OPTIMISM,
        amount,
        '0x',
        {
          gasLimit: 30000000,
        }
      )
      const receipt = await tx.wait()

      expect(receipt.logs.length).to.equal(9)
      receipt.logs.forEach((log: Log) => {
        expect(log.address).to.be.oneOf([
          UDT_OPTIMISM,
          '0x4200000000000000000000000000000000000016',
          '0x4200000000000000000000000000000000000007',
          '0x4200000000000000000000000000000000000010',
        ])
        if (log.address === '0x4200000000000000000000000000000000000016') {
          // L2ToL1MessagePasser
          const iface = new ethers.Interface(L2ToL1MessagePasserAbi)
          const event = iface.parseLog(log)
          expect(event.name).to.equal('MessagePassed')
          // nonce
          expect(event.args[0]).to.be.greaterThan(
            1766847064778384329583297500742918515827483896875618958121606201292642364n
          )
          // sender (L2CrossDomainMessenger)
          expect(event.args[1]).to.equal(
            '0x4200000000000000000000000000000000000007'
          )
          // target (L1CrossDomainMessengerProxy)
          expect(event.args[2]).to.equal(
            '0x25ace71c97B33Cc4729CF772ae268934F7ab5fA1'
          )
          // value
          expect(event.args[3]).to.equal(0n)
          // gasLimit
          expect(event.args[4]).to.equal(491822n)
          // data TODO: parse
          // expect(event.args[5]).to.equal(
          //   "0xd764ad0b000100000000000000000000000000000000000000000000000000000000583100000000000000000000000067ad6ea566ba6b0fc52e97bc25ce46120fdac04c00000000000000000000000099c9fc46f92e8a1c0dec1b1747d010903e884be10000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000030d4000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000a41635f5fd000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
          // );
          // withdrawalHash
          // expect(event.args[6]).to.equal(
          //   "0x947ced62ac63cc5e0243fd8872a05be5b75fe70a8f022189702f8be6d3f929cf"
          // );
        } else if (
          log.address === '0x4200000000000000000000000000000000000007'
        ) {
          // L2CrossDomainMessenger
          const iface = new ethers.Interface(L2CrossDomainMessenger)
          const event = iface.parseLog(log)
          expect(event.name).to.be.oneOf([
            'SentMessage',
            'SentMessageExtension1',
          ])
          if (event.name === 'SentMessage') {
            // target (L1StandardBridgeProxy)
            expect(event.args[0]).to.equal(
              '0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1'
            )
            // sender
            expect(event.args[1]).to.equal(
              '0x4200000000000000000000000000000000000010'
            )
            // message : TODO: parse
            // expect(event.args[2]).to.equal(
            //   "0x0166a07a00000000000000000000000090de74265a416e1393a450752175aed98fe11517000000000000000000000000c709c9116dbf29da9c25041b13a07a0e68ac5d2d00000000000000000000000067ad6ea566ba6b0fc52e97bc25ce46120fdac04c000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb922660000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000"
            // );
            // messageNonce
            expect(event.args[3]).to.greaterThan(
              '1766847064778384329583297500742918515827483896875618958121606201292642353'
            )
            // gasLimit
            expect(event.args[4]).to.equal('200000')
          } else if (event.name === 'SentMessageExtension1') {
            // sender
            expect(event.args[0]).to.equal(
              '0x4200000000000000000000000000000000000010'
            )
            // value
            expect(event.args[1]).to.equal(0)
          }
        } else if (
          log.address === '0x4200000000000000000000000000000000000010'
        ) {
          const iface = new ethers.Interface(L2StandardBridge)
          const event = iface.parseLog(log)
          expect(event.name).to.be.oneOf([
            'WithdrawalInitiated',
            'ERC20BridgeInitiated',
          ])
          if (event.name === 'WithdrawalInitiated') {
            // l1Token
            expect(event.args[0]).to.equal(UDT)
            // l2Token
            expect(event.args[1]).to.equal(UDT_OPTIMISM)
            // From
            expect(event.args[2]).to.equal(bridgeAddress)
            // To
            expect(event.args[3]).to.equal(recipient)
            // Amount
            expect(event.args[4]).to.equal(amount)
            // ExtraData
            expect(event.args[5]).to.equal('0x')
          } else if (event.name === 'ERC20BridgeInitiated') {
            // localToken
            expect(event.args[0]).to.equal(UDT_OPTIMISM)
            // remoteToken
            expect(event.args[1]).to.equal(UDT)
            // from
            expect(event.args[2]).to.equal(bridgeAddress)
            // to
            expect(event.args[3]).to.equal(recipient)
            // amount
            expect(event.args[4]).to.equal(amount)
            // extraData
            expect(event.args[5]).to.equal('0x')
          }
        }
      })
    })
  })
})
