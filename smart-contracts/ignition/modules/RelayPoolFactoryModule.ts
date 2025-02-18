import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('RelayPoolFactory', (m) => {
  const hyperlaneMailbox = m.getParameter('hyperlaneMailbox')
  const weth = m.getParameter('weth')
  const timelock = m.getParameter('timelock')

  const relayPoolFactory = m.contract('RelayPoolFactory', [
    hyperlaneMailbox,
    weth,
    timelock,
  ])
  return { relayPoolFactory }
})
