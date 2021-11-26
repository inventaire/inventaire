const { db, elasticsearch, dataseed, mediaStorage } = require('config')
const _ = require('lodash')
const dns = require('dns')
const networkInterfaces = require('os').networkInterfaces()
const { promisify } = require('util')
const lookup = promisify(dns.lookup)

const localIps = Object.values(networkInterfaces)
  .map(networkInterface => _.map(networkInterface, 'address'))
  .concat([
    '0.0.0.0',
    '127.0.0.1',
  ])

const getHostname = host => host ? new URL(host).hostname : null

const getHostnameIp = async hostname => {
  const { address } = await lookup(hostname)
  return address
}

const servicesHostnames = _.uniq(_.compact([
  db.hostname,
  getHostname(elasticsearch.host),
  getHostname(dataseed.host),
  getHostname(mediaStorage.swift.publicUrl),
]))

let restrictedIpsSet

Promise.all(servicesHostnames.map(getHostnameIp))
.then(servicesIps => {
  restrictedIpsSet = new Set(_.flatten(localIps.concat(servicesIps)))
  console.log('restrictedIpsSet', restrictedIpsSet)
})

// It would be safer to run requests on submitted urls from an isolated process
// but in the meantime, this mitigates risks of server-side request forgery
const isRestrictedHost = async url => {
  const { hostname } = new URL(url)
  // - resolve domain names to IP addresses
  // - converts alternative IP addresses representations to the classic representation
  const { address: ip } = await lookup(hostname)
  return restrictedIpsSet.has(ip) || isInPrivateIpRange(ip)
}

const getPaddedBinary = num => parseInt(num).toString(2).padStart(8, '0')

const getIpBinaryRepresentation = ip => ip.split('.').map(getPaddedBinary).join('')

const binaryPrefix = range => {
  const [ ip, mask ] = range.split('/')
  const binary = getIpBinaryRepresentation(ip)
  return binary.slice(0, parseInt(mask))
}

// Source: https://en.wikipedia.org/wiki/Reserved_IP_addresses#IPv4
const privateIpRangePrefixes = [
  binaryPrefix('0.0.0.0/8'),
  binaryPrefix('10.0.0.0/8'),
  binaryPrefix('100.64.0.0/10'),
  binaryPrefix('127.0.0.0/8'),
  binaryPrefix('172.16.0.0/12'),
  binaryPrefix('192.168.0.0/16'),
]

const isInPrivateIpRange = ip => {
  const binaryIp = getIpBinaryRepresentation(ip)
  return privateIpRangePrefixes.some(binaryRangePrefix => {
    return binaryIp.startsWith(binaryRangePrefix)
  })
}

module.exports = { isRestrictedHost }
