// hardhat ignition is not supported rn
// https://github.com/NomicFoundation/hardhat-ignition/issues/825
import { Wallet, Provider } from 'zksync-ethers'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy/dist/deployer'
import { type JsonRpcResult } from 'ethers'
import { getProvider } from '@relay-protocol/helpers'
import networks from '@relay-protocol/networks'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export async function getZkSyncBridgeContracts(chainId: bigint) {
  const { rpc } = networks[chainId!.toString()]
  const rpcURL = rpc || `https://rpc.unlock-protocol.com/${chainId}`
  const resp = await fetch(rpcURL, {
    body: JSON.stringify({
      id: 1,
      jsonrpc: '2.0',
      method: 'zks_getBridgeContracts',
      params: [],
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

export async function deployContract(
  hre: HardhatRuntimeEnvironment,
  contractNameOrFullyQualifiedName: string,
  deployArgs = []
) {
  const { deployer } = await zkSyncSetupDeployer(hre)
  const artifact = await deployer.loadArtifact(contractNameOrFullyQualifiedName)

  const deploymentFee = await deployer.estimateDeployFee(artifact, deployArgs)
  const parsedFee = hre.ethers.formatEther(deploymentFee.toString())
  console.log(`Deployment is estimated to cost ${parsedFee} ETH`)

  const contract = await deployer.deploy(artifact, deployArgs)

  await contract.waitForDeployment()
  const address = await contract.getAddress()
  const { hash } = await contract.deploymentTransaction()

  return {
    contract,
    hash,
    address,
  }
}

async function zkSyncSetupDeployer(hre: HardhatRuntimeEnvironment) {
  // set deployer
  const wallet = await hre.zksyncEthers.getWallet(0)
  const deployer = new Deployer(hre, wallet)
  return { wallet, deployer }
}
