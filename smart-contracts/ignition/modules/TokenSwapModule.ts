import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('TokenSwap', (m) => {
  // get params
  const uniswapUniversalRouter = m.getParameter('uniswapUniversalRouter')

  const tokenSwap = m.contract('TokenSwap', [uniswapUniversalRouter])
  return { tokenSwap }
})
