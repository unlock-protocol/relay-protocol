export const relayPoolFactoryAbi = [
  {
    inputs: [
      { internalType: 'address', name: 'hMailbox', type: 'address' },
      { internalType: 'address', name: 'weth', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
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
  },
  {
    inputs: [
      { internalType: 'contract IERC20', name: 'asset', type: 'address' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'symbol', type: 'string' },
      {
        components: [
          { internalType: 'uint32', name: 'chainId', type: 'uint32' },
          { internalType: 'address', name: 'bridge', type: 'address' },
          { internalType: 'address', name: 'proxyBridge', type: 'address' },
          { internalType: 'uint256', name: 'maxDebt', type: 'uint256' },
        ],
        internalType: 'struct OriginParam[]',
        name: 'origins',
        type: 'tuple[]',
      },
      { internalType: 'address', name: 'thirdPartyPool', type: 'address' },
    ],
    name: 'deployPool',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'hyperlaneMailbox',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'wrappedEth',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
