import { task } from 'hardhat/config'

// deploy a simple ERC4626 pool for testing purposes
task('deploy:dummy-yield-pool', 'Deploy a dummy yield pool')
  .addParam('asset', 'An ERC20 asset')
  .setAction(async ({ asset }, { ethers, run }) => {
    // parse asset metadata
    const assetContract = await ethers.getContractAt('MyToken', asset)
    const name = `${await assetContract.name()} Dummy Yield Pool`
    const symbol = `${await assetContract.symbol()}-YIELD`
    const yieldPool = await ethers.deployContract('MyYieldPool', [
      asset,
      name,
      symbol,
    ])
    const yieldPoolAddress = await yieldPool.getAddress()
    console.log(`Dummy yield pool deployed at ${yieldPoolAddress}`)

    // Wait for the transaction to be mined before verifying!
    let attempts = 0
    let verified = false
    console.log('Verifying...')
    while (!verified) {
      attempts += 1
      await yieldPool.deploymentTransaction()!.wait(attempts)
      await run('verify:verify', {
        address: yieldPoolAddress,
        constructorArguments: [asset, name, symbol],
      })
        .then(() => {
          verified = true
        })
        .catch((e) => {
          if (attempts >= 10) {
            throw e
          }
        })
    }
    return yieldPoolAddress
  })
