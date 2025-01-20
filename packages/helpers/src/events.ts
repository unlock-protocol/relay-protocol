import { TransactionReceipt, Log, Interface, LogDescription } from 'ethers'

const parseLogs = (logs: readonly Log[], iface: Interface) =>
  logs.map((log) => {
    const parsed = iface.parseLog(log)
    return parsed ? parsed : log
  })

export const getEvent = async (
  receipt: TransactionReceipt,
  eventName: string,
  iface?: Interface
) => {
  const events = await getEvents(receipt, eventName, iface)
  const event = (events.events || [])[0] as LogDescription
  const { args } = event || {}
  return { event, args, ...events }
}

export const getEvents = async (
  receipt: TransactionReceipt,
  eventName: string,
  iface?: Interface
) => {
  const { hash, logs, blockNumber } = receipt

  const events = (iface ? parseLogs(logs, iface) : logs).filter(
    (log) => (log as LogDescription)?.name === eventName
  )
  return { hash, events, blockNumber }
}
