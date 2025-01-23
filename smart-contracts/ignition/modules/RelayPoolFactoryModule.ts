import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('RelayPoolFactory', (m) => {
  const hyperlaneMailbox = m.getParameter('hyperlaneMailbox')
  const weth = m.getParameter('weth')

  const relayPoolFactory = m.contract('RelayPoolFactory', [
    hyperlaneMailbox,
    weth,
  ])
  return { relayPoolFactory }
})
