const { db, elasticsearch, dataseed, mediaStorage } = require('config')
const _ = require('lodash')
const ipIsInPrivateIpRange = require('./is_in_private_ip_range')
const { dnsLookup, getHostname, getHostnameIp } = require('./helpers')

const servicesHostnames = _.uniq(_.compact([
  db.hostname,
  getHostname(elasticsearch.host),
  getHostname(dataseed.host),
  getHostname(mediaStorage.swift.publicUrl),
]))

let serviceIpsSet

Promise.all(servicesHostnames.map(getHostnameIp))
.then(servicesIps => {
  serviceIpsSet = new Set(servicesIps)
})

// It would be safer to run requests on submitted urls from an isolated process
// but in the meantime, this mitigates risks of server-side request forgery
module.exports = async url => {
  const { hostname } = new URL(url)
  // - resolve domain names to IP addresses
  // - converts alternative IP addresses representations to the classic representation
  const { address: resolvedIp } = await dnsLookup(hostname)
  return serviceIpsSet.has(resolvedIp) || ipIsInPrivateIpRange(resolvedIp)
}
