const error_ = require('lib/error/error')

const getIpBinaryRepresentation = ip => {
  const isIpv6 = ip.includes(':')
  const maxLength = isIpv6 ? 16 : 8
  const parts = isIpv6 ? getIpv6Parts(ip) : getIpv4Parts(ip)
  // Assumes that dns.lookup was already performed
  // and thus that only doted-decimal IPs will be passed as IPv4
  if (!isIpv6 && parts.length !== 4) throw error_.new('unexpected ip representation', 500, { ip })
  return parts.map(part => getPaddedBinary(part, maxLength)).join('')
}

const getIpv4Parts = address => address.split('.').map(part => parseInt(part, 10))

const getIpv6Parts = address => {
  const defineParts = address.split(':').filter(part => part !== '')
  const missingPartsCount = 8 - defineParts.length
  const missingParts = new Array(missingPartsCount).fill('0').join(':')
  const filledAddress = address.replace('::', `:${missingParts}:`).replace(/^:/, '').replace(/:$/, '')
  return filledAddress.split(':').map(part => parseInt(part, 16))
}

const getPaddedBinary = (num, maxLenght) => parseInt(num).toString(2).padStart(maxLenght, '0')

module.exports = { getIpBinaryRepresentation }
