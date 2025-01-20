import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('CCTPBridgeProxy', (m) => {
  // unpack args
  const USDC = m.getParameter('usdc')
  const messenger = m.getParameter('messenger')
  const transmitter = m.getParameter('transmitter')

  const bridge = m.contract('CCTPBridgeProxy', [messenger, transmitter, USDC])
  return { bridge }
})
