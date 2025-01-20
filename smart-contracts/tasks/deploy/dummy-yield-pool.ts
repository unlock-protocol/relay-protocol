import { task } from 'hardhat/config'

// deploy a simple ERC4626 pool for testing purposes
task('deploy:dummy-yield-pool', 'Deploy a dummy yield pool')
  .addParam('asset', 'An ERC20 asset')
  .setAction(async ({ asset }, { ethers }) => {
    // parse asset metadata
    const assetContract = await ethers.getContractAt('MyToken', asset)
    const name = `${await assetContract.name()} Dummy Yield Pool`
    const symbol = `${await assetContract.symbol()}-YIELD`
    console.log(asset, name, symbol)
    const yiedlPool = await ethers.deployContract('MyYieldPool', [
      asset,
      name,
      symbol,
    ])
    console.log(`Dummy yield pool deployed at ${await yiedlPool.getAddress()}`)
  })
