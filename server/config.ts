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

export const publicOrigin: AbsoluteUrl = publicPort ? `${publicProtocol}://${publicHostname}:${publicPort}` : `${publicProtocol}://${publicHostname}`

export const publicHost = publicOrigin.split('://')[1]
export const federatedMode = config.federation.remoteEntitiesOrigin != null

export const defaultFrom = `${config.instanceName} <${config.contactAddress}>`

export function getLocalOrigin () {
  return `${protocol}://${hostname}:${port}`
}

export let mediaStorageEndpoint
const { mode } = mediaStorage
if (mode === 'local') {
  mediaStorageEndpoint = `${getLocalOrigin()}/local/`
} else {
  mediaStorageEndpoint = config.mediaStorage[mode].publicURL
}

export default config
