import { softwareName, version } from '#lib/package'
import { sendStaticJson } from '#lib/responses'
import config, { publicHost } from '#server/config'

const { env, instanceName, orgName, orgUrl, mapTilesAccessToken } = config
const { remoteEntitiesOrigin } = config.federation

const clientConfig = {
  version,
  softwareName,
  env,
  instanceName,
  orgName,
  orgUrl,
  remoteEntitiesOrigin,
  mapTilesAccessToken,
  publicHost,
} as const

const stringifiedClientConfig = JSON.stringify(clientConfig)

// A endpoint dedicated to pass configuration parameters to the client
export default {
  get: (req, res) => sendStaticJson(res, stringifiedClientConfig),
}

export type ClientConfig = typeof clientConfig
