import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('ArbitrumOrbitNativeBridgeProxy', (m) => {
  const routerGateway = m.getParameter('routerGateway')
  const outbox = m.getParameter('outbox')
  const bridge = m.contract('ArbitrumOrbitNativeBridgeProxy', [
    routerGateway,
    outbox,
  ])
  return { bridge }
})
