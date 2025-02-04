import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('ZkSyncBridgeProxy', (m) => {
  // unpack args
  const l2SharedDefaultBridge = m.getParameter('l2SharedDefaultBridge')
  const l1SharedDefaultBridge = m.getParameter('l1SharedDefaultBridge')

  const bridge = m.contract('ZkSyncBridgeProxy', [
    l2SharedDefaultBridge,
    l1SharedDefaultBridge,
  ])
  return { bridge }
})
