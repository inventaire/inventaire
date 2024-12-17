import { sendStaticJson } from '#lib/responses'
import config from '#server/config'

const { piwik, mapTilesAccessToken } = config

const endpoint = piwik.enabled ? piwik.endpoint : null

const clientConfig = JSON.stringify({
  piwik: endpoint && endpoint.replace('/piwik.php', ''),
  mapTilesAccessToken,
})

// A endpoint dedicated to pass configuration parameters to the client
export default {
  get: (req, res) => sendStaticJson(res, clientConfig),
}
