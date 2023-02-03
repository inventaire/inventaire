import CONFIG from 'config'
import { sendStaticJson } from '#lib/responses'

const { piwik } = CONFIG

const endpoint = piwik.enabled ? piwik.endpoint : null

const clientConfig = JSON.stringify({
  piwik: endpoint && endpoint.replace('/piwik.php', '')
})

// A endpoint dedicated to pass configuration parameters to the client
export default {
  get: (req, res) => sendStaticJson(res, clientConfig)
}
