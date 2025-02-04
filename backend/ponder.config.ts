import { createConfig, factory } from 'ponder'

import {
  RelayPool,
  RelayBridge,
  RelayPoolFactory,
  RelayBridgeFactory,
} from '@relay-protocol/abis'
import { createNetworkConfig } from './src/utils/rpc'
import { Abi, AbiEvent } from 'viem'

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
      abi: RelayPoolFactory as Abi,
      network: {
        sepolia: {
          address: '0xa6A1E3FE900282372a8c7d2a758aBAa1ba3EC7D5',
        },
      },
    },
    RelayPool: {
      abi: RelayPool as Abi,
      network: 'sepolia',
      address: factory({
        address: '0xa6A1E3FE900282372a8c7d2a758aBAa1ba3EC7D5',
        event: RelayPoolFactory.find(
          (e) => e.name === 'PoolDeployed'
        ) as AbiEvent,
        parameter: 'pool',
      }),
      startBlock: 7499300,
    },
    RelayBridgeFactory: {
      abi: RelayBridgeFactory as Abi,
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
      abi: RelayBridge as Abi,
      network: {
        opSepolia: {
          address: factory({
            address: [
              '0xacDFfaA0323440e123D68C25a073e99DeB82e3fC',
              '0x70e4A2b8de43459Fef02419A406158cD34A88dc3',
            ],
            event: RelayBridgeFactory.find(
              (e) => e.name === 'BridgeDeployed'
            ) as AbiEvent,
            parameter: 'bridge',
          }),
          startBlock: 7499300,
        },
        baseSepolia: {
          address: factory({
            address: ['0xBB68C66467699faB205304810a1b288487F460d4'],
            event: RelayBridgeFactory.find(
              (e) => e.name === 'BridgeDeployed'
            ) as AbiEvent,
            parameter: 'bridge',
          }),
          startBlock: 20991910,
        },
        arbSepolia: {
          address: factory({
            address: ['0x2499D94880B30fA505543550ac8a1e24cfFeFe78'],
            event: RelayBridgeFactory.find(
              (e) => e.name === 'BridgeDeployed'
            ) as AbiEvent,
            parameter: 'bridge',
          }),
          startBlock: 117524900,
        },
      },
    },
  },
})
