import { createConfig, factory } from 'ponder'

// ABIs
import { relayPoolAbi } from './abis/relayPool'
import { relayBridgeAbi } from './abis/relayBridge'
import { relayPoolFactoryAbi } from './abis/relayPoolFactory'
import { relayBridgeFactoryAbi } from './abis/relayBridgeFactory'
import { createNetworkConfig } from './src/utils/rpc'

const poolDeployedEvent = {
  anonymous: false,
  inputs: [
    {
      indexed: false,
      internalType: 'address',
      name: 'pool',
      type: 'address',
    },
    {
      indexed: false,
      internalType: 'address',
      name: 'creator',
      type: 'address',
    },
    {
      indexed: false,
      internalType: 'address',
      name: 'asset',
      type: 'address',
    },
    { indexed: false, internalType: 'string', name: 'name', type: 'string' },
    {
      indexed: false,
      internalType: 'string',
      name: 'symbol',
      type: 'string',
    },
    {
      components: [
        { internalType: 'uint32', name: 'chainId', type: 'uint32' },
        { internalType: 'address', name: 'bridge', type: 'address' },
        { internalType: 'address', name: 'proxyBridge', type: 'address' },
        { internalType: 'uint256', name: 'maxDebt', type: 'uint256' },
      ],
      indexed: false,
      internalType: 'struct OriginParam[]',
      name: 'origins',
      type: 'tuple[]',
    },
    {
      indexed: false,
      internalType: 'address',
      name: 'thirdPartyPool',
      type: 'address',
    },
  ],
  name: 'PoolDeployed',
  type: 'event',
}

const bridgeDeployedEvent = {
  anonymous: false,
  inputs: [
    {
      indexed: false,
      internalType: 'address',
      name: 'bridge',
      type: 'address',
    },
    {
      indexed: true,
      internalType: 'address',
      name: 'asset',
      type: 'address',
    },
    {
      indexed: true,
      internalType: 'address',
      name: 'proxyBridge',
      type: 'address',
    },
  ],
  name: 'BridgeDeployed',
  type: 'event',
}

export default createConfig({
  database: {
    kind: 'postgres',
    connectionString: process.env.DATABASE_URL,
  },
  networks: {
    sepolia: createNetworkConfig(11155111),
    opSepolia: createNetworkConfig(11155420),
    baseSepolia: createNetworkConfig(84532),
    arbSepolia: createNetworkConfig(421614),
  },
  contracts: {
    RelayPoolFactory: {
      abi: relayPoolFactoryAbi,
      network: {
        sepolia: {
          address: '0xF06fB9fBC957e99D4B527B0a73a894A483EA1c46',
        },
      },
    },
    RelayPool: {
      abi: relayPoolAbi,
      network: 'sepolia',
      address: factory({
        address: '0xF06fB9fBC957e99D4B527B0a73a894A483EA1c46',
        // @ts-expect-error The expected type comes from property 'event' which is declared here on type 'Factory<AbiEvent>'
        event: poolDeployedEvent,
        parameter: 'pool',
      }),
      startBlock: 7499300,
    },
    RelayBridgeFactory: {
      abi: relayBridgeFactoryAbi,
      network: {
        opSepolia: {
          address: [
            '0xacDFfaA0323440e123D68C25a073e99DeB82e3fC',
            '0x70e4A2b8de43459Fef02419A406158cD34A88dc3',
          ],
        },
        baseSepolia: {
          address: '0xBB68C66467699faB205304810a1b288487F460d4',
        },
        arbSepolia: {
          address: '0x2499D94880B30fA505543550ac8a1e24cfFeFe78',
        },
      },
    },
    RelayBridge: {
      abi: relayBridgeAbi,
      network: {
        opSepolia: {
          address: factory({
            address: [
              '0xacDFfaA0323440e123D68C25a073e99DeB82e3fC',
              '0x70e4A2b8de43459Fef02419A406158cD34A88dc3',
            ],
            event: bridgeDeployedEvent,
            parameter: 'bridge',
          }),
          startBlock: 7499300,
        },
        baseSepolia: {
          address: factory({
            address: ['0xBB68C66467699faB205304810a1b288487F460d4'],
            event: bridgeDeployedEvent,
            parameter: 'bridge',
          }),
          startBlock: 20991910,
        },
        arbSepolia: {
          address: factory({
            address: ['0x2499D94880B30fA505543550ac8a1e24cfFeFe78'],
            event: bridgeDeployedEvent,
            parameter: 'bridge',
          }),
          startBlock: 117524900,
        },
      },
    },
  },
  blocks: {
    YieldUpdate: {
      network: {
        sepolia: {
          startBlock: 7441464,
          interval: 100, // Every 100 blocks
        },
      },
    },
  },
})
