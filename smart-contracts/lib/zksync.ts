// hardhat ignition is not supported rn
// https://github.com/NomicFoundation/hardhat-ignition/issues/825
import { Wallet, Provider } from 'zksync-ethers'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy/dist/deployer'
import ethers from 'ethers'
import { type JsonRpcResult } from 'ethers'
import hre, { zkUpgrades } from 'hardhat'
import { getProvider } from '@relay-protocol/helpers'
import networks from '@relay-protocol/networks'

export async function getZkSyncBridgeContracts() {
  const { chainId } = hre.network.config
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
  contractNameOrFullyQualifiedName: string,
  deployArgs = []
) {
  const { deployer } = await zkSyncSetupDeployer()
  const artifact = await deployer.loadArtifact(contractNameOrFullyQualifiedName)

  const deploymentFee = await deployer.estimateDeployFee(artifact, deployArgs)
  const parsedFee = ethers.formatEther(deploymentFee.toString())
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

export async function deployUpgradeableContract(
  contractNameOrFullyQualifiedName: string,
  deployArgs = [],
  deployOptions = {}
) {
  const { deployer } = await zkSyncSetupDeployer()
  const artifact = await deployer.loadArtifact(contractNameOrFullyQualifiedName)

  const contract = await zkUpgrades.deployProxy(
    deployer.zkWallet,
    artifact,
    deployArgs,
    deployOptions
  )

  await contract.waitForDeployment()
  const contractAddress = await contract.getAddress()
  const { hash } = contract.deployTransaction

  return {
    contract,
    hash,
    address: contractAddress,
  }
}

async function zkSyncSetupDeployer() {
  // set provider and accounts
  const { chainId } = hre.network.config
  console.log({ chainId })
  const provider = (await getProvider(chainId!)) as Provider
  console.log(provider)
  let wallet
  if (process.env.DEPLOYER_PRIVATE_KEY) {
    wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider)
  } else {
    throw 'missing deployer key, cant deploy on zksync. Export DEPLOYER_PRIVATE_KEY'
  }

  // set deployer
  const deployer = new Deployer(hre, wallet)

  return { provider, wallet, deployer }
}

export default {
  deployContract,
  deployUpgradeableContract,
}
