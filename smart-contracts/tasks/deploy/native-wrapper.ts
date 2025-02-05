import { task } from 'hardhat/config'

import RelayPoolNativeGatewayModule from '../../ignition/modules/RelayPoolNativeGatewayModule'

task('deploy:native-wrapper', 'Deploy a WETH/Native wrapper for a relay pool')
  .addParam('pool', 'A realy pool address')
  .setAction(async ({ pool }, { ethers, ignition }) => {
    const { chainId } = await ethers.provider.getNetwork()

    const poolContract = new ethers.Contract(
      pool,
      ['function asset() view returns (address)'],
      ethers.provider
    )

    const weth = await poolContract.asset()

    // deploy the pool using ignition
    const parameters = {
      RelayPoolNativeGateway: {
        pool,
        weth,
      },
    }

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
