import { createConfig, factory } from 'ponder'
import { Portal2 } from '@relay-protocol/helpers/abis'

import {
  RelayPool,
  RelayBridge,
  RelayPoolFactory,
  RelayBridgeFactory,
} from '@relay-protocol/abis'
import { createNetworkConfig } from './src/utils/rpc'
import { Abi, AbiEvent } from 'viem'
import { getAddresses } from '@relay-protocol/addresses'
import networks from '@relay-protocol/networks'

const deployedAddresses = getAddresses()

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
    // Relay contracts
    RelayPoolFactory: {
      abi: RelayPoolFactory as Abi,
      network: {
        sepolia: {
          address: deployedAddresses['11155111'].RelayPoolFactory,
        },
      },
    },
    RelayPool: {
      abi: RelayPool as Abi,
      network: 'sepolia',
      address: factory({
        address: deployedAddresses['11155111'].RelayPoolFactory,
        event: RelayPoolFactory.find(
          (e) => e.name === 'PoolDeployed'
        ) as AbiEvent,
        parameter: 'pool',
      }),
      startBlock: 7609300, // TODO: add to `getAddress` ?
    },
    RelayBridgeFactory: {
      abi: RelayBridgeFactory as Abi,
      network: {
        opSepolia: {
          address: deployedAddresses['11155420'].RelayBridgeFactory,
        },
        baseSepolia: {
          address: deployedAddresses['84532'].RelayBridgeFactory,
        },
        arbSepolia: {
          address: deployedAddresses['421614'].RelayBridgeFactory,
        },
      },
    },
    RelayBridge: {
      abi: RelayBridge as Abi,
      network: {
        opSepolia: {
          address: factory({
            address: deployedAddresses['11155420'].RelayBridgeFactory,
            event: RelayBridgeFactory.find(
              (e) => e.name === 'BridgeDeployed'
            ) as AbiEvent,
            parameter: 'bridge',
          }),
          startBlock: 23446570,
        },
        baseSepolia: {
          address: factory({
            address: deployedAddresses['84532'].RelayBridgeFactory,
            event: RelayBridgeFactory.find(
              (e) => e.name === 'BridgeDeployed'
            ) as AbiEvent,
            parameter: 'bridge',
          }),
          startBlock: 21463700,
        },
        arbSepolia: {
          address: factory({
            address: deployedAddresses['421614'].RelayBridgeFactory,
            event: RelayBridgeFactory.find(
              (e) => e.name === 'BridgeDeployed'
            ) as AbiEvent,
            parameter: 'bridge',
          }),
          startBlock: 121036190,
        },
      },
    },

    // Third-party contracts
    OPPortal: {
      abi: Portal2,
      network: {
        sepolia: {
          address: [
            networks['11155111']!.bridges!.op!.portalProxy! as `0x${string}`,
            networks['11155111']!.bridges!.base!.portalProxy! as `0x${string}`,
          ],
          startBlock: 7600000,
        },
      },
    },
  },
  blocks: {
    VaultSnapshot: {
      network: 'sepolia',
      startBlock: 7609300,
      interval: 25, // ~5 minutes with 12s block time
    },
  },
})
