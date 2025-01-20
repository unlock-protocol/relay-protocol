import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('OPStackNativeBridgeProxy', (m) => {
  const portalProxy = m.getParameter('portalProxy')
  const bridge = m.contract('OPStackNativeBridgeProxy', [portalProxy])
  return { bridge }
})
