import networks from '@relay-protocol/networks'
import { ethers } from 'ethers'

export const getSignerForNetwork = async (network: number) => {
  const provider = new ethers.JsonRpcProvider(networks[network].rpc[0])
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  return signer
}
