import { eq } from 'ponder'
import { Context, Event } from 'ponder:registry'
import { bridgeTransaction } from 'ponder:schema'

export default async function ({
  event,
  context,
}: {
  event: Event<'RelayBridge:OutBoxTransactionExecuted'>
  context: Context<'RelayBridge:OutBoxTransactionExecuted'>
}) {
  // 0x22e9C539f31f403C81119De9e630D8fB18BC5964
  // console.log('OutBoxTransactionExecuted', event.args)
  if (
    event.args.l2Sender.toLowerCase() ===
    '0x22e9c539f31f403c81119de9e630d8fb18bc5964'.toLocaleLowerCase()
  ) {
    console.log('OutBoxTransactionExecuted', event.args)
    // process.exit()
  }
}
