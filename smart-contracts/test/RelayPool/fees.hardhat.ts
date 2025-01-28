import { expect } from 'chai'
import { AbiCoder } from 'ethers'
import { ethers, ignition } from 'hardhat'
import { getBalance, getEvent } from '@relay-protocol/helpers'
import RelayPoolModule from '../../ignition/modules/RelayPoolModule'
import { MyToken, MyWeth, MyYieldPool, RelayPool } from '../../typechain-types'

const relayBridgeOptimism = '0x0000000000000000000000000000000000000010'
const oPStackNativeBridgeProxy = '0x0000000000000000000000000000000000000010'

export const encodeData = (
  nonce: bigint,
  recipient: string,
  amount: bigint
) => {
  const abiCoder = new AbiCoder()
  const types = ['uint256', 'address', 'uint256']
  return abiCoder.encode(types, [nonce, recipient, amount])
}

describe('Fees', () => {
  let relayPool: RelayPool
  let myToken: MyToken
  let thirdPartyPool: MyYieldPool
  let myWeth: MyWeth

  before(async () => {
    const [user] = await ethers.getSigners()
    const userAddress = await user.getAddress()
    myToken = await ethers.deployContract('MyToken', ['My Token', 'TOKEN'])
    expect(await myToken.totalSupply()).to.equal(1000000000000000000000000000n)

    myWeth = await ethers.deployContract('MyWeth')

    // deploy 3rd party pool
    thirdPartyPool = await ethers.deployContract('MyYieldPool', [
      await myToken.getAddress(),
      'My Yield Pool',
      'YIELD',
    ])
    // deploy the pool using ignition
    const parameters = {
      RelayPool: {
        hyperlaneMailbox: userAddress, // using the user address as the mailbox so we can send transactions!
        asset: await myToken.getAddress(),
        name: 'ERC20 RELAY POOL',
        symbol: 'ERC20-REL',
        origins: [
          {
            chainId: 10,
            bridge: relayBridgeOptimism,
            maxDebt: ethers.parseEther('10'),
            proxyBridge: oPStackNativeBridgeProxy,
          },
        ],
        thirdPartyPool: await thirdPartyPool.getAddress(),
        weth: await myWeth.getAddress(),
        bridgeFee: 5, // (0.05%)
        curator: userAddress,
      },
    }
    ;({ relayPool } = await ignition.deploy(RelayPoolModule, {
      parameters,
    }))

    const liquidity = ethers.parseUnits('100', 18)
    await myToken.connect(user).mint(liquidity)
    await myToken.connect(user).approve(await relayPool.getAddress(), liquidity)
    await relayPool.connect(user).deposit(liquidity, await user.getAddress())
  })

  it('should transfer the assets from the pool to the recipient net of fees', async () => {
    const recipientAddress = ethers.Wallet.createRandom().address

    const amount = ethers.parseUnits('1')
    const fees = (amount * (await relayPool.bridgeFee())) / 10000n
    const recipientBalanceBefore = await myToken.balanceOf(recipientAddress) // Probably 0
    const outstandingDebtBefore = await relayPool.outstandingDebt() // Probably 0
    const collectedFeesBefore = await relayPool.totalCollectedFees() // Probably 0
    await relayPool.handle(
      10,
      ethers.zeroPadValue(relayBridgeOptimism, 32),
      encodeData(1n, recipientAddress, amount)
    )

    const userBalanceAfter = await myToken.balanceOf(recipientAddress)
    expect(userBalanceAfter).to.equal(recipientBalanceBefore + amount - fees)
    const outstandingDebtAfter = await relayPool.outstandingDebt()
    expect(outstandingDebtAfter).to.equal(outstandingDebtBefore + amount - fees)
    const collectedFeesAfter = await relayPool.totalCollectedFees()
    expect(collectedFeesAfter).to.equal(collectedFeesBefore + fees)
  })
})
