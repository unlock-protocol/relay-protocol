export const cctpBridgeProxyAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'messenger',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'transmitter',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'usdc',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'TOKEN_NOT_BRIDGED',
    type: 'error',
  },
  {
    inputs: [],
    name: 'MESSENGER',
    outputs: [
      {
        internalType: 'contract ITokenMessenger',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'TRANSMITTER',
    outputs: [
      {
        internalType: 'contract IMessageTransmitter',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'USDC',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'sender',
        type: 'address',
      },
      { internalType: 'uint32', name: '', type: 'uint32' },
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'currency',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      { internalType: 'bytes', name: '', type: 'bytes' },
    ],
    name: 'bridge',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '', type: 'address' },
      {
        internalType: 'bytes',
        name: 'bridgeParams',
        type: 'bytes',
      },
    ],
    name: 'claim',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
