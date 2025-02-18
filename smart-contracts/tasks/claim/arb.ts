import { task } from 'hardhat/config'
import { constructArbProof } from '@relay-protocol/helpers'

task('claim:arb', 'Claim ARB from bridge')
  .addParam('txHash', 'Tx hash on origin chain')
  .addParam('origin', 'Origin chain id')
  .addParam('bridge', 'The proxy bridge contract on dest chain')
  .addParam('pool', 'The pool on dest chain')
  .setAction(async ({ txHash, origin, pool, bridge }, { ethers }) => {
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
    } = await constructArbProof(txHash, origin)

    // TODO: check if the root hasn't been confirmed yet on L1
    // const { chainId } = await ethers.provider.getNetwork()
    // const {
    //   arb: { outbox: outboxAddress },
    // } = networks[chainId.toString()]
    // const outbox = await ethers.getContractAt(OUTBOX_ABI, outboxAddress)
    // if ((await outbox.roots(proof[0])) == ethers.zeroPadBytes('', 32)) {
    //   throw Error('Not ready')
    // }

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

    const relayPool = await ethers.getContractAt('RelayPool', pool)
    const abiCoder = relayPool.interface.getAbiCoder()

    // // send claim to the pool
    const BridgesParams = abiCoder.encode(
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

    const tx = await relayPool.claim(origin, bridge, BridgesParams)

    console.log(tx)
  })
