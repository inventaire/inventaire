const { sendStaticJson } = require('lib/responses')
const { piwik } = require('config')
const endpoint = piwik.enabled ? piwik.endpoint : null

const clientConfig = JSON.stringify({
  piwik: endpoint && endpoint.replace('/piwik.php', '')
})

// A endpoint dedicated to pass configuration parameters to the client
module.exports = {
  get: (req, res) => sendStaticJson(res, clientConfig)
}
