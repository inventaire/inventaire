import { Agent as HttpAgent } from 'node:http'
import { Agent as HttpsAgent } from 'node:https'
import config from '#server/config'

const { ipFamily: family } = config.outgoingRequests

const maxSocketsPerHost = 10

// See https://nodejs.org/api/http.html#http_class_http_agent
// and https://nodejs.org/api/net.html#socketconnectoptions-connectlistener
const commonBase = {
  keepAlive: true,
  family,
  maxSockets: maxSocketsPerHost,
}

const httpAgent = new HttpAgent(commonBase)
export const httpsAgent = new HttpsAgent(commonBase)

export const insecureHttpsAgent = new HttpsAgent({
  ...commonBase,
  // Useful to:
  // - accept self-signed certificates
  // - accept certificates that would otherwise generate a UNABLE_TO_VERIFY_LEAF_SIGNATURE error
  rejectUnauthorized: false,
})

const wikidataQueryAgent = new HttpsAgent({
  ...commonBase,
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
