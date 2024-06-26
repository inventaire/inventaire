import { compact, uniq } from 'lodash-es'
import config from '#server/config'
import { dnsLookup, getHostname, getHostnameIp } from './helpers.js'
import ipIsInPrivateIpRange from './is_in_private_ip_range.js'

const { db, elasticsearch, dataseed, mediaStorage } = config

const servicesHostnames = uniq(compact([
  db.hostname,
  getHostname(elasticsearch.origin),
  getHostname(dataseed.origin),
  getHostname(mediaStorage.swift.publicURL),
]))

const servicesIps = await Promise.all(servicesHostnames.map(getHostnameIp))
const serviceIpsSet = new Set(compact(servicesIps))

// It would be safer to run requests on submitted urls from an isolated process
// but in the meantime, this mitigates risks of server-side request forgery
export default async function (url) {
  const { hostname } = new URL(url)
  // - resolve domain names to IP addresses
  // - converts alternative IP addresses representations to the classic representation
  const { address: resolvedIp } = await dnsLookup(hostname)
  return serviceIpsSet.has(resolvedIp) || ipIsInPrivateIpRange(resolvedIp)
}
