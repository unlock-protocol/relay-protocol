import { ethers, ignition } from 'hardhat'
import { expect } from 'chai'
import { type Signer } from 'ethers'

import { ArbitrumOrbitNativeBridgeProxy } from '../../typechain-types'
import { networks } from '@relay-protocol/networks'
import { stealERC20 } from '../utils/hardhat'
// import ERC20_ABI from '@relay-protocol/helpers/abis/ERC20.json'
import { getBalance } from '@relay-protocol/helpers'
import ArbitrumOrbitNativeBridgeProxyModule from '../../ignition/modules/ArbitrumOrbitNativeBridgeProxyModule'

const { udt: UDT, weth: l1Weth } = networks[1]
const {
  udt: UDT_ARBITRUM,
  arb: { routerGateway },
} = networks[42161]

const amount = ethers.parseEther('1')

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
        l1Weth,
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
    // https://sepolia.arbiscan.io/tx/0x075f42ae6e150209c543959ca8b0f1e3bedcf146c86fb19a073f783b38ed15f3
    const withdrawTx =
      '0x075f42ae6e150209c543959ca8b0f1e3bedcf146c86fb19a073f783b38ed15f3'

    describe.skip('using ERC20')

    describe.skip('using ETH', () => {
      let balanceBefore
      // https://arbiscan.io/tx/0x650570bd55b1bf54cd64d8882b4cc8b58f06c475ec17fdba93f2fbfa23fca340
      const withdrawTx =
        '0x650570bd55b1bf54cd64d8882b4cc8b58f06c475ec17fdba93f2fbfa23fca340'

      it('should work', async () => {
        balanceBefore = await getBalance(await recipient.getAddress())
        const tx = await bridge.claim()
        const receipt = await tx.wait()
      })
    })
  })
})
