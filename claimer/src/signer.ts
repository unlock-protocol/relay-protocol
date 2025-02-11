import { NetworkConfig } from '@relay-protocol/types'
import { ethers } from 'ethers'

export const getSignerForNetwork = async (network: NetworkConfig) => {
  const provider = new ethers.JsonRpcProvider(network.rpc[0])
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)
  console.log(`Signer address: ${signer.address}`)
  return signer
}
