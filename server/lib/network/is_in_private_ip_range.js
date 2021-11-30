const { getIpBinaryRepresentation } = require('./ip_binary_representation')

// resolvedIp: ip as returned by dns.lookup
module.exports = resolvedIp => {
  const isIpv6 = resolvedIp.includes(':')
  const binaryIp = getIpBinaryRepresentation(resolvedIp)
  const privateIpRangePrefixes = isIpv6 ? privateIpv6RangePrefixes : privateIpv4RangePrefixes
  return privateIpRangePrefixes.some(binaryRangePrefix => {
    return binaryIp.startsWith(binaryRangePrefix)
  })
}

const binaryPrefix = range => {
  const [ ip, mask ] = range.split('/')
  const binary = getIpBinaryRepresentation(ip)
  return binary.slice(0, parseInt(mask))
}

// Source: https://en.wikipedia.org/wiki/Reserved_IP_addresses#IPv4
const privateIpv4RangePrefixes = [
  binaryPrefix('0.0.0.0/8'),
  binaryPrefix('10.0.0.0/8'),
  binaryPrefix('100.64.0.0/10'),
  binaryPrefix('127.0.0.0/8'),
  binaryPrefix('172.16.0.0/12'),
  binaryPrefix('192.168.0.0/16'),
]

// Source: https://en.wikipedia.org/wiki/Reserved_IP_addresses#IPv6
const privateIpv6RangePrefixes = [
  binaryPrefix('::1/128'),
  binaryPrefix('fc00::/7'),
  binaryPrefix('fe80::/10'),

  // Rejecting IPv4/IPv6 translation
  binaryPrefix('::ffff:0:0:0/96'),
  binaryPrefix('::ffff:0:0/96'),
  binaryPrefix('64:ff9b::/96'),
  binaryPrefix('64:ff9b:1::/48'),
]
