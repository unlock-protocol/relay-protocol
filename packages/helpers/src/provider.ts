import { ethers, type JsonRpcResult } from 'ethers'
import { networks } from '@relay-protocol/networks'

export const getProvider = (chainId: bigint | string | number) => {
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
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'eth_getBlockByHash',
      params: [blockHash, false],
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })
  const { result } = (await resp.json()) as JsonRpcResult
  return result
}
