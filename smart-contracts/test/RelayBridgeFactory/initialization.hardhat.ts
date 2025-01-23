import { expect } from 'chai'
import { ethers, ignition } from 'hardhat'
import { MyToken, RelayBridgeFactory } from '../../typechain-types'
import RelayBridgeFactoryModule from '../../ignition/modules/RelayBridgeFactoryModule'
import { getEvent } from '../../lib/utils'

describe('RelayBridgeFactory: deployment', () => {
  let relayBridgeFactory: RelayBridgeFactory
  let myToken: MyToken
  const hyperlaneMailbox = '0x1000000000000000000000000000000000000000'

  before(async () => {
    const { chainId } = await ethers.provider.getNetwork()

    myToken = await ethers.deployContract('MyToken', ['My Token', 'TOKEN'])
    expect(await myToken.totalSupply()).to.equal(1000000000000000000000000000n)
    ;({ relayBridgeFactory } = await ignition.deploy(RelayBridgeFactoryModule, {
      parameters: {
        RelayBridgeFactory: {
          hyperlaneMailbox,
        },
      },
      deploymentId: `RelayBridgeFactory-${chainId.toString()}`,
    }))
  })

  it('should let user deploy a bridge', async () => {
    const [user] = await ethers.getSigners()

    const oPStackNativeBridgeProxy =
      '0x0000000000000000000000000000000000000111'
    const tx = await relayBridgeFactory.deployBridge(
      await myToken.getAddress(),
      oPStackNativeBridgeProxy
    )
    const receipt = await tx.wait()
    const event = await getEvent(
      receipt!,
      'BridgeDeployed',
      relayBridgeFactory.interface
    )
    const bridgeAddress = event.args.bridge
    const bridge = await ethers.getContractAt('RelayBridge', bridgeAddress)
    expect(await bridge.asset()).to.equal(await myToken.getAddress())
    expect(event.args.asset).to.equal(await myToken.getAddress())
    expect(event.args.proxyBridge).to.equal(oPStackNativeBridgeProxy)

    expect(
      await relayBridgeFactory.bridgesByAsset(await myToken.getAddress(), 0)
    ).to.equal(bridgeAddress)
  })
})
