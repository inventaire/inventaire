const { Agent: HttpAgent } = require('node:http')
const { Agent: HttpsAgent } = require('node:https')
const httpAgent = new HttpAgent({ keepAlive: true })
const httpsAgent = new HttpsAgent({ keepAlive: true })

const insecureHttpsAgent = new HttpsAgent({
  keepAlive: true,
  // Useful to:
  // - accept self-signed certificates
  // - accept certificates that would otherwise generate a UNABLE_TO_VERIFY_LEAF_SIGNATURE error
  rejectUnauthorized: false
})

// Using a custom agent to set keepAlive=true
// https://nodejs.org/api/http.html#http_class_http_agent
// https://github.com/bitinn/node-fetch#custom-agent
const getAgent = ({ protocol }) => protocol === 'http:' ? httpAgent : httpsAgent

module.exports = { getAgent, insecureHttpsAgent }
