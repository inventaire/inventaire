import dns from 'node:dns'
import { promisify } from 'node:util'
import type { AbsoluteUrl, Hostname } from '#types/common'

export const dnsLookup = promisify(dns.lookup)

export const getHostname = (url: AbsoluteUrl) => url ? new URL(url).hostname : null
export const getHost = (url: AbsoluteUrl) => url ? new URL(url).host : null

export async function getHostnameIp (hostname: Hostname) {
  try {
    const { address } = await dnsLookup(hostname)
    return address
  } catch (err) {
    if (err.code !== 'ENOTFOUND') throw err
  }
}
