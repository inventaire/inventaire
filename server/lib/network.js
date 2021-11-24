const { db, elasticsearch, dataseed, mediaStorage } = require('config')
const _ = require('lodash')
const dns = require('dns')
const networkInterfaces = require('os').networkInterfaces()
const { promisify } = require('util')
const lookup = promisify(dns.lookup)

// It might be less error-prone to just setup an isolated process from which to run the request

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
})

const isRestrictedHost = async url => {
  const { hostname } = new URL(url)
  // - resolve domain names to IP addresses
  // - converts alternative IP addresses representations to the classic representation
  const { address: ip } = await lookup(hostname)
  return restrictedIpsSet.has(ip)
}

module.exports = { isRestrictedHost }
