const CONFIG = require('config')
const __ = CONFIG.universalPath
const { sendStaticJson } = __.require('lib', 'responses')
const { piwik } = CONFIG
const endpoint = piwik.enabled ? piwik.endpoint : null

const clientConfig = JSON.stringify({
  piwik: endpoint && endpoint.replace('/piwik.php', '')
})

// A endpoint dedicated to pass configuration parameters to the client
module.exports = {
  get: (req, res) => sendStaticJson(res, clientConfig)
}
