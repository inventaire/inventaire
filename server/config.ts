import _config from 'config'
import type { AbsoluteUrl } from '#types/common'
import type { Config } from '#types/config'

const config: Config = _config

const {
  protocol,
  hostname,
  port,
  mediaStorage,
  publicHostname,
  publicProtocol,
  publicPort,
} = config

export let publicOrigin: AbsoluteUrl

if (publicPort === null) {
  publicOrigin = `${publicProtocol}://${publicHostname}`
} else if (publicPort) {
  publicOrigin = `${publicProtocol}://${publicHostname}:${publicPort}`
} else {
  // If the config doesn't specify a publicPort, not even null, fallback on the config.port
  publicOrigin = `${publicProtocol}://${publicHostname}:${port}`
}

export const publicHost = publicOrigin.split('://')[1]
export const localOrigin = `${protocol}://${hostname}:${port}` as AbsoluteUrl

export const federatedMode = config.federation.remoteEntitiesOrigin != null

export const defaultFrom = `${config.instanceName} <${config.contactAddress}>`

export let mediaStorageEndpoint
const { mode } = mediaStorage
if (mode === 'local') {
  mediaStorageEndpoint = `${localOrigin}/local/`
} else {
  let { publicURL } = config.mediaStorage[mode]
  if (!publicURL.endsWith('/')) publicURL += '/'
  mediaStorageEndpoint = publicURL
}

export default config
