import { ethers, ignition } from 'hardhat'
import { AbiCoder, Interface } from 'ethers'
import { expect } from 'chai'

import { ZkSyncBridgeProxy } from '../../typechain-types'
import { networks } from '@relay-protocol/networks'
import { getEvent, getBalance } from '@relay-protocol/helpers'
import { ERC20 as ERC20_ABI } from '@relay-protocol/helpers/abis'
import ZkSyncBridgeProxyModule from '../../ignition/modules/ZkSyncBridgeProxyModule'

const ETH_CHAIN_ID = 11155111n
const ZKSYNC_CHAIN_ID = 300n
const {
  bridges: {
    zksync: { l2SharedDefaultBridge, l1SharedDefaultBridge },
  },
  assets: { weth: USDC },
} = networks[ETH_CHAIN_ID.toString()]

// USDC bridge tx on Sepolia
// https://sepolia-era.zksync.network/tx/0x94372eed4202154a87527eed4f24ec1cabd77630db7b7172ea82a52fe1608274
const recipientAddress = '0x246A13358Fb27523642D86367a51C2aEB137Ac6C'
const amount = 1000n

// construct the actual proof
const returnedProof = {
  l1BatchNumber: 13523,
  l2MessageIndex: 6,
  l2TxNumberInBlock: 240,
  message:
    '0x11a2ccc1246a13358fb27523642d86367a51c2aeb137ac6c1c7d4b196cb0c7b01d743fbc6116a902379c723800000000000000000000000000000000000000000000000000000000000003e8',
  sender: '0x681A1AFdC2e06776816386500D2D461a6C96cB45',
  proof: [
    '0x2bfb4d4babd077f13ab7b723da6266962f6977c7d02be162c6f8afb67e0bf6d7',
    '0x1edd6057bcbda3e1e1cfd2c845644248272f0cb3255541eb9ec63ee6fd89f46e',
    '0x80f27360c37f8896f3d29ca5ccef8da115ec7d613ef8d8b624705df61a097dd7',
    '0x60d24c3ddd85d8e7ed957465a52bd9e1e4d9d26b72c6fb50dfc7a6e24e28dbb1',
    '0xe4733f281f18ba3ea8775dd62d2fcd84011c8c938f16ea5790fd29a03bf8db89',
    '0x1798a1fd9c8fbb818c98cff190daa7cc10b6e5ac9716b4a2649f7c2ebcef2272',
    '0x66d7c5983afe44cf15ea8cf565b34c6c31ff0cb4dd744524f7842b942d08770d',
    '0xb04e5ee349086985f74b73971ce9dfe76bbed95c84906c5dffd96504e1e5396c',
    '0xac506ecb5465659b3a927143f6d724f91d8d9c4bdb2463aee111d9aa869874db',
    '0x124b05ec272cecd7538fdafe53b6628d31188ffb6f345139aac3c3c1fd2e470f',
    '0xc3be9cbd19304d84cca3d045e06b8db3acd68c304fc9cd4cbffe6d18036cb13f',
    '0xfef7bd9f889811e59e4076a0174087135f080177302763019adaf531257e3a87',
    '0xa707d1c62d8be699d34cb74804fdd7b4c568b6c1a821066f126c680d4b83e00b',
    '0xf6e093070e0389d2e529d60fadb855fdded54976ec50ac709e3a36ceaa64c291',
  ],
}

// encode args to pass to pool
const args = [
  ZKSYNC_CHAIN_ID,
  returnedProof.l1BatchNumber,
  returnedProof.l2MessageIndex,
  returnedProof.l2TxNumberInBlock,
  returnedProof.message,
  returnedProof.proof,
]

// send claim to the pool
const abiCoder = new AbiCoder()
const bridgeParams = abiCoder.encode(
  ['uint256', 'uint256', 'uint256', 'uint16', 'bytes', 'bytes32[]'],
  args
)

describe('ZkSyncBridgeProxy', function () {
  let bridge: ZkSyncBridgeProxy

  before(async () => {
    // deploy using ignition
    const parameters = {
      ZkSyncBridgeProxy: {
        l2SharedDefaultBridge,
        l1SharedDefaultBridge,
      },
    }

    ;({ bridge } = await ignition.deploy(ZkSyncBridgeProxyModule, {
      parameters,
    }))
  })

  it('constructor values are correct', async () => {
    expect(await bridge.L2_SHARED_BRIDGE()).to.be.equal(l2SharedDefaultBridge)
    expect(await bridge.L1_SHARED_BRIDGE()).to.be.equal(l1SharedDefaultBridge)
  })

  describe('claim using BridgeProxy directly', () => {
    it('works with ERC20 (USDC)', async () => {
      const balanceBefore = await getBalance(
        recipientAddress,
        USDC!,
        ethers.provider
      )
      const tx = await bridge.claim(ethers.ZeroAddress, bridgeParams)
      const balanceAfter = await getBalance(
        recipientAddress,
        USDC!,
        ethers.provider
      )

      const receipt = await tx.wait()

      // weth transfer happened
      const { event: erc20TransferEvent } = await getEvent(
        receipt!,
        'Transfer',
        new Interface(ERC20_ABI)
      )
      expect(erc20TransferEvent.args.to).to.equals(recipientAddress)
      expect(erc20TransferEvent.args.value).to.equals(amount.toString())
    })
  })
})
