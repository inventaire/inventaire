import dns from 'node:dns'
import { promisify } from 'node:util'

export const dnsLookup = promisify(dns.lookup)

export const getHostname = origin => origin ? new URL(origin).hostname : null

export async function getHostnameIp (hostname) {
  try {
    const { address } = await dnsLookup(hostname)
    return address
  } catch (err) {
    if (err.code !== 'ENOTFOUND') throw err
  }
}
