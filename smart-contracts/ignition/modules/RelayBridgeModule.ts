import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('RelayBridge', (m) => {
  // unpack args
  const asset = m.getParameter('asset')
  const hyperlaneMailbox = m.getParameter('hyperlaneMailbox')

  // TODO: deploy relevant bridge proxy directly from ignition submodule ?
  // blocker is how to read the relevant (cctp / OP/ arb) switch flag in ignition
  const bridgeProxy = m.getParameter('bridgeProxy')

  const bridge = m.contract('RelayBridge', [
    asset,
    bridgeProxy,
    hyperlaneMailbox,
  ])
  return { bridge }
})
