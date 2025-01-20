import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('RelayPoolNativeGateway', (m) => {
  // unpack args
  const wethAddress = m.getParameter('weth')
  const poolAddress = m.getParameter('pool')

  const nativeGateway = m.contract('RelayPoolNativeGateway', [
    wethAddress,
    poolAddress,
  ])
  return { nativeGateway }
})
