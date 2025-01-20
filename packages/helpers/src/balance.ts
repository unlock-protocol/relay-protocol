import { ethers } from 'ethers'
import { getProvider } from './provider'
import ERC20_ABI from './abis/ERC20.json'

export async function getBalance(
  account: string,
  tokenAddress = ethers.ZeroAddress,
  chainId: bigint
) {
  let balance
  const provider = await getProvider(chainId)

  if (!tokenAddress || tokenAddress === ethers.ZeroAddress) {
    // ETH balance
    balance = await provider.getBalance(account)
  } else {
    // erc20 balance
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    balance = await token.balanceOf(account)
  }
  return balance
}
