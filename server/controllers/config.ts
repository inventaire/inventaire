import { sendStaticJson } from '#lib/responses'
import config, { publicHost } from '#server/config'

const { instanceName, orgName, orgUrl, piwik, mapTilesAccessToken } = config
const { remoteEntitiesOrigin } = config.federation

const endpoint = piwik.enabled ? piwik.endpoint : null

const clientConfig = JSON.stringify({
  instanceName,
  orgName,
  orgUrl,
  remoteEntitiesOrigin,
  piwik: endpoint && endpoint.replace('/piwik.php', ''),
  mapTilesAccessToken,
  publicHost,
})

// A endpoint dedicated to pass configuration parameters to the client
export default {
  get: (req, res) => sendStaticJson(res, clientConfig),
}
