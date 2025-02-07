import { NetworkConfig } from '@relay-protocol/types'
import { ethers } from 'ethers'

export const getSignerForNetwork = async (network: NetworkConfig) => {
  console.log(network)
  const provider = new ethers.JsonRpcProvider(network.rpc)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)
  return signer
}
