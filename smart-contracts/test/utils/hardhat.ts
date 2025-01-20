import { ethers, network } from 'hardhat'

export const addSomeETH = async (
  address: string,
  amount = ethers.parseEther('1000')
) => {
  const balance = `0x${BigInt(amount.toString()).toString(16)}`
  await network.provider.send('hardhat_setBalance', [address, balance])
}

export const impersonate = async (address: string) => {
  await ethers.provider.send('hardhat_impersonateAccount', [address])
  await addSomeETH(address) // give some ETH just in case

  // return signer
  const signer = await ethers.provider.getSigner(address)
  return signer
}

export const stealERC20 = async function (
  tokenAddress: string,
  from: string,
  to: string,
  amount = ethers.parseEther('1000')
) {
  const whale = await ethers.getSigner(from)
  await impersonate(whale.address)

  const erc20Contract = await ethers.getContractAt('IERC20', tokenAddress)
  await erc20Contract.connect(whale).transfer(to, amount)
  return erc20Contract
}

export const mintUSDC = async (
  usdcAddress: string,
  recipientAddress: string,
  amount = 1000n
) => {
  const usdc = await ethers.getContractAt('IUSDC', usdcAddress)
  const masterMinter = await usdc.masterMinter()
  await impersonate(masterMinter)
  const minter = await ethers.getSigner(masterMinter)
  await usdc.connect(minter).configureMinter(recipientAddress, ethers.MaxInt256)
  const recipient = await ethers.getSigner(recipientAddress)
  await usdc.connect(recipient).mint(recipientAddress, amount)
}
