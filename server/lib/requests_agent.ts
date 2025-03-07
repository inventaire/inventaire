import { Agent as HttpAgent } from 'node:http'
import { Agent as HttpsAgent } from 'node:https'
import config from '#server/config'

const { ipFamily: family } = config.outgoingRequests

const maxSocketsPerHost = 10

const httpAgent = new HttpAgent({
  keepAlive: true,
  family,
  maxSockets: maxSocketsPerHost,
})

export const httpsAgent = new HttpsAgent({
  keepAlive: true,
  family,
  maxSockets: maxSocketsPerHost,
})

export const insecureHttpsAgent = new HttpsAgent({
  keepAlive: true,
  // Useful to:
  // - accept self-signed certificates
  // - accept certificates that would otherwise generate a UNABLE_TO_VERIFY_LEAF_SIGNATURE error
  rejectUnauthorized: false,
  family,
  maxSockets: maxSocketsPerHost,
})

const wikidataQueryAgent = new HttpsAgent({
  keepAlive: true,
  family,
  // Wikidata Query Service limits to roughtly 5 concurrent requests per IP, depending on use pattern
  // see https://www.mediawiki.org/wiki/Wikidata_Query_Service/User_Manual#Query_limits
  maxSockets: 5,
})

// Using a custom agent to set keepAlive=true
// https://nodejs.org/api/http.html#http_class_http_agent
// https://github.com/bitinn/node-fetch#custom-agent
export function getAgent ({ protocol, host }) {
  if (host === 'query.wikidata.org') return wikidataQueryAgent
  return protocol === 'http:' ? httpAgent : httpsAgent
}
