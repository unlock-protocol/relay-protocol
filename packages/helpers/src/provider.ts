import { ethers } from 'ethers'
import { networks } from '@relay-protocol/networks'

export const getProvider = (chainId: bigint | string) => {
  const { rpc } = networks[chainId.toString()]
  const rpcURL = rpc || `https://rpc.unlock-protocol.com/${chainId}`
  const provider = new ethers.JsonRpcProvider(rpcURL)
  return provider
}

export const fetchRawBlock = async (
  chainId: bigint | string,
  blockHash: string
) => {
  const { rpc } = networks[chainId.toString()]
  const rpcURL = rpc || `https://rpc.unlock-protocol.com/${chainId}`

  const resp = await fetch(rpcURL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getBlockByHash',
      params: [blockHash, false],
      id: 1,
    }),
  })
  const { result } = await resp.json()
  return result
}
