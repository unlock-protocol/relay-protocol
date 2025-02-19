import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('RelayBridge', (m) => {
  // unpack args
  const asset = m.getParameter('asset')
  const hyperlaneMailbox = m.getParameter('hyperlaneMailbox')

  const bridgeProxy = m.getParameter('bridgeProxy')

  const bridge = m.contract('RelayBridge', [
    asset,
    bridgeProxy,
    hyperlaneMailbox,
  ])
  return { bridge }
})
