const CONFIG = require('config')
const __ = CONFIG.universalPath
const { sendStaticJson } = __.require('lib', 'responses')

const clientConfig = JSON.stringify({
  piwik: CONFIG.piwik.endpoint.replace('/piwik.php', '')
})

// A endpoint dedicated to pass configuration parameters to the client
module.exports = {
  get: (req, res) => sendStaticJson(res, clientConfig)
}
