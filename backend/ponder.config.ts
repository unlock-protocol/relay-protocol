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
          address: '0x1c1601077b3eeF14E5825a5fB0b87926Ad23cB90',
        },
      },
    },
    RelayPool: {
      abi: RelayPool as Abi,
      network: 'sepolia',
      address: factory({
        address: '0x1c1601077b3eeF14E5825a5fB0b87926Ad23cB90',
        event: RelayPoolFactory.find(
          (e) => e.name === 'PoolDeployed'
        ) as AbiEvent,
        parameter: 'pool',
      }),
      startBlock: 7609300,
    },
    RelayBridgeFactory: {
      abi: RelayBridgeFactory as Abi,
      network: {
        opSepolia: {
          address: '0x5765883E120F707A528F3e476636304De9280b6c',
        },
        baseSepolia: {
          address: '0x5e30883816434C8C92534241729b80309B520A30',
        },
        arbSepolia: {
          address: '0x1402D55BF0D6566ca8F569041000a8015b608632',
        },
      },
    },
    RelayBridge: {
      abi: RelayBridge as Abi,
      network: {
        opSepolia: {
          address: factory({
            address: '0x5765883E120F707A528F3e476636304De9280b6c',
            event: RelayBridgeFactory.find(
              (e) => e.name === 'BridgeDeployed'
            ) as AbiEvent,
            parameter: 'bridge',
          }),
          startBlock: 23446570,
        },
        baseSepolia: {
          address: factory({
            address: '0x5e30883816434C8C92534241729b80309B520A30',
            event: RelayBridgeFactory.find(
              (e) => e.name === 'BridgeDeployed'
            ) as AbiEvent,
            parameter: 'bridge',
          }),
          startBlock: 21463700,
        },
        arbSepolia: {
          address: factory({
            address: '0x1402D55BF0D6566ca8F569041000a8015b608632',
            event: RelayBridgeFactory.find(
              (e) => e.name === 'BridgeDeployed'
            ) as AbiEvent,
            parameter: 'bridge',
          }),
          startBlock: 121036190,
        },
      },
    },
  },
})
