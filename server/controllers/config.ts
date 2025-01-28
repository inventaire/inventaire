import { sendStaticJson } from '#lib/responses'
import config, { publicHost } from '#server/config'

const { instanceName, orgName, orgUrl, mapTilesAccessToken } = config
const { remoteEntitiesOrigin } = config.federation

const clientConfig = JSON.stringify({
  instanceName,
  orgName,
  orgUrl,
  remoteEntitiesOrigin,
  mapTilesAccessToken,
  publicHost,
})

// A endpoint dedicated to pass configuration parameters to the client
export default {
  get: (req, res) => sendStaticJson(res, clientConfig),
}
