// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { Agent: HttpAgent } = require('http')
const { Agent: HttpsAgent } = require('https')
const httpAgent = new HttpAgent({ keepAlive: true })
const httpsAgent = new HttpsAgent({ keepAlive: true })

const selfSignedHttpsAgent = new HttpsAgent({
  keepAlive: true,
  // Accept self-signed certificates
  rejectUnauthorized: false
})

// Using a custom agent to set keepAlive=true
// https://nodejs.org/api/http.html#http_class_http_agent
// https://github.com/bitinn/node-fetch#custom-agent
const getAgent = ({ protocol }) => protocol === 'http:' ? httpAgent : httpsAgent

module.exports = { getAgent, selfSignedHttpsAgent }
