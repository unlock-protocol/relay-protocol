import { RelayVaultService } from '@relay-protocol/client'

const vaultService = new RelayVaultService(
  'https://relay-protocol-production.up.railway.app/' // TODO: add to config?
)

export const start = async () => {
  return {
    vaultService,
  }
}

export const stop = async () => {}
