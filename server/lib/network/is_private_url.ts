import CONFIG from 'config'
import { compact, uniq } from 'lodash-es'
import { dnsLookup, getHostname, getHostnameIp } from './helpers.js'
import ipIsInPrivateIpRange from './is_in_private_ip_range.js'

const { db, elasticsearch, dataseed, mediaStorage } = CONFIG

const servicesHostnames = uniq(compact([
  db.hostname,
  getHostname(elasticsearch.origin),
  getHostname(dataseed.origin),
  getHostname(mediaStorage.swift.publicUrl),
]))

let serviceIpsSet

Promise.all(servicesHostnames.map(getHostnameIp))
.then(servicesIps => {
  serviceIpsSet = new Set(servicesIps)
})

// It would be safer to run requests on submitted urls from an isolated process
// but in the meantime, this mitigates risks of server-side request forgery
export default async url => {
  const { hostname } = new URL(url)
  // - resolve domain names to IP addresses
  // - converts alternative IP addresses representations to the classic representation
  const { address: resolvedIp } = await dnsLookup(hostname)
  return serviceIpsSet.has(resolvedIp) || ipIsInPrivateIpRange(resolvedIp)
}
