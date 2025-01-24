import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'

export default buildModule('SwapAndDeposit', (m) => {
  // get params
  const uniswapUniversalRouter = m.getParameter('uniswapUniversalRouter')

  const swapper = m.contract('SwapAndDeposit', [uniswapUniversalRouter])
  return { swapper }
})
