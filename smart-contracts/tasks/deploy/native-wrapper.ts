import { task } from 'hardhat/config'

import RelayPoolNativeGatewayModule from '../../ignition/modules/RelayPoolNativeGatewayModule'

task('deploy:native-wrapper', 'Deploy a WETH/Native wrapper for a relay pool')
  .addParam('pool', 'A realy pool address')
  .addParam('weth', 'Deployed WETH9 contract')
  .setAction(async ({ pool, weth }, { ethers, ignition }) => {
    // deploy the pool using ignition
    const parameters = {
      RelayPoolNativeGateway: {
        pool,
        weth,
      },
    }
    const { chainId } = await ethers.provider.getNetwork()
    const { nativeGateway } = await ignition.deploy(
      RelayPoolNativeGatewayModule,
      {
        parameters,
        deploymentId: `RelayPoolNativeGateway-${chainId.toString()}`,
      }
    )
    console.log(
      `WETH/ETH native gateway deployed to: ${await nativeGateway.getAddress()}`
    )
  })
