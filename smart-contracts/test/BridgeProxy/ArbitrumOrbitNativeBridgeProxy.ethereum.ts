import { ethers, ignition } from 'hardhat'
import { type JsonRpcApiProvider } from 'ethers'
import { expect } from 'chai'
import { type Signer } from 'ethers'

import { ArbitrumOrbitNativeBridgeProxy } from '../../typechain-types'
import { networks } from '@relay-protocol/networks'
import { constructProof, getBalance } from '@relay-protocol/helpers'
import ArbitrumOrbitNativeBridgeProxyModule from '../../ignition/modules/ArbitrumOrbitNativeBridgeProxyModule'

const ARB_CHAIN_ID = 42161n
const {
  arb: { routerGateway, outbox },
} = networks[1]

describe('ArbitrumOrbitNativeBridgeProxy', function () {
  let bridge: ArbitrumOrbitNativeBridgeProxy
  let l1Bridge: Signer
  let recipient: Signer

  before(async () => {
    ;[recipient, l1Bridge] = await ethers.getSigners()

    // deploy using ignition
    const parameters = {
      ArbitrumOrbitNativeBridgeProxy: {
        routerGateway,
        outbox,
      },
    }

    ;({ bridge } = await ignition.deploy(ArbitrumOrbitNativeBridgeProxyModule, {
      parameters,
    }))
  })

  it('constructor values are correct', async () => {
    expect(await bridge.ROUTER()).to.be.equal(routerGateway)
    expect(await bridge.ARB_SYS()).to.be.equal(
      '0x0000000000000000000000000000000000000064'
    )
  })

  describe('claim', () => {
    describe.skip('using ERC20')

    // we can not test this as constructing the proof
    // require calls to the precompiled contracts on Arbitrum
    // and this is not supported by hardhat
    // (see 'constructProof.ts' in `@relay-protocol/helpers`)
    it.skip('works using ETH', async () => {
      // https://arbiscan.io/tx/0x650570bd55b1bf54cd64d8882b4cc8b58f06c475ec17fdba93f2fbfa23fca340
      const originTxHash =
        '0x650570bd55b1bf54cd64d8882b4cc8b58f06c475ec17fdba93f2fbfa23fca340'
      const recipientAddress = '0x246A13358Fb27523642D86367a51C2aEB137Ac6C'

      const balanceBefore = await getBalance(
        recipientAddress,
        ethers.ZeroAddress,
        ethers.provider
      )

      // construct the actual proof
      const {
        proof,
        leaf,
        caller,
        destination,
        arbBlockNum,
        ethBlockNum,
        timestamp,
        callvalue,
        data,
      } = await constructProof(
        originTxHash,
        ARB_CHAIN_ID,
        1n,
        ethers.provider as JsonRpcApiProvider
      )

      // encode args to pass to pool
      const args = [
        proof,
        leaf, // position/index
        caller, //l2 sender
        destination, // to
        arbBlockNum, //l2block
        ethBlockNum, // l1block
        timestamp, //l2 ts
        callvalue, // value
        data,
      ]
      console.log(data)

      // const relayPool = await ethers.getContractAt('RelayPool', pool)
      // const relayPool = await ethers.getContractAt('RelayPool', pool)
      const abiCoder = bridge.interface.getAbiCoder()

      // send claim to the pool
      const claimArgs = abiCoder.encode(
        [
          'bytes32[]',
          'uint256',
          'address',
          'address',
          'uint256',
          'uint256',
          'uint256',
          'uint256',
          'bytes',
        ],
        args
      )

      console.log(claimArgs)
      const tx = await bridge.claim(ethers.ZeroAddress, claimArgs)
      const balanceAfter = await getBalance(
        recipientAddress,
        ethers.ZeroAddress,
        ethers.provider
      )

      expect(balanceAfter).to.equals(
        balanceBefore + ethers.parseEther('0.000001')
      )

      // it('should work', async () => {
      //   const tx = await bridge.claim()
      //   const receipt = await tx.wait()
      // })
    })
  })
})
