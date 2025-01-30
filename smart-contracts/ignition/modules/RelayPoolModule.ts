import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('RelayPool', (m) => {
  // get addresses
  const hyperlaneMailbox = m.getParameter('hyperlaneMailbox')
  const asset = m.getParameter('asset')

  const name = m.getParameter('name')
  const symbol = m.getParameter('symbol')
  const origins = m.getParameter('origins')
  const thirdPartyPool = m.getParameter('thirdPartyPool')
  const weth = m.getParameter('weth')
  const curator = m.getParameter('curator')

  const relayPool = m.contract('RelayPool', [
    hyperlaneMailbox,
    asset,
    name,
    symbol,
    origins,
    thirdPartyPool,
    weth,
    curator,
  ])
  return { relayPool }
})
