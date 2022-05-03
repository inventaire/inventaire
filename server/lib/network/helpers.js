const dns = require('node:dns')
const { promisify } = require('node:util')
const dnsLookup = promisify(dns.lookup)

const getHostname = host => host ? new URL(host).hostname : null

const getHostnameIp = async hostname => {
  const { address } = await dnsLookup(hostname)
  return address
}

module.exports = {
  dnsLookup,
  getHostname,
  getHostnameIp,
}
