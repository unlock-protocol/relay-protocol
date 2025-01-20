import { mainnets } from './mainnets'
import { testnets } from './testnets'

export * from './mainnets'
export * from './testnets'

export const networks = { ...mainnets, ...testnets }
