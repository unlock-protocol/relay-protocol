import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('RelayBridgeFactory', (m) => {
  const hyperlaneMailbox = m.getParameter('hyperlaneMailbox')

  const relayBridgeFactory = m.contract('RelayBridgeFactory', [
    hyperlaneMailbox,
  ])
  return { relayBridgeFactory }
})
