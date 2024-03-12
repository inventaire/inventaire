import { Agent as HttpAgent } from 'node:http'
import { Agent as HttpsAgent } from 'node:https'
import CONFIG from '#server/config'

const { ipFamily: family } = CONFIG.outgoingRequests

const httpAgent = new HttpAgent({ keepAlive: true, family })
export const httpsAgent = new HttpsAgent({ keepAlive: true, family })

export const insecureHttpsAgent = new HttpsAgent({
  keepAlive: true,
  // Useful to:
  // - accept self-signed certificates
  // - accept certificates that would otherwise generate a UNABLE_TO_VERIFY_LEAF_SIGNATURE error
  rejectUnauthorized: false,
  family,
})

// Using a custom agent to set keepAlive=true
// https://nodejs.org/api/http.html#http_class_http_agent
// https://github.com/bitinn/node-fetch#custom-agent
export const getAgent = ({ protocol }) => protocol === 'http:' ? httpAgent : httpsAgent
