import { sendStaticJson } from '#lib/responses'
import config, { publicHost } from '#server/config'

const { instanceName, orgName, orgUrl, matomo, mapTilesAccessToken } = config
const { remoteEntitiesOrigin } = config.federation

const endpoint = matomo.enabled ? matomo.endpoint : null

const clientConfig = JSON.stringify({
  instanceName,
  orgName,
  orgUrl,
  remoteEntitiesOrigin,
  matomo: endpoint && endpoint.replace('/matomo.php', ''),
  mapTilesAccessToken,
  publicHost,
})

// A endpoint dedicated to pass configuration parameters to the client
export default {
  get: (req, res) => sendStaticJson(res, clientConfig),
}
