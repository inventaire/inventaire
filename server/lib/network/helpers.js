import dns from 'node:dns'
import { promisify } from 'node:util'
const dnsLookup = promisify(dns.lookup)

const getHostname = origin => origin ? new URL(origin).hostname : null

const getHostnameIp = async hostname => {
  const { address } = await dnsLookup(hostname)
  return address
}

export default {
  dnsLookup,
  getHostname,
  getHostnameIp,
}
