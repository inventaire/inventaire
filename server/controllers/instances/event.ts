import { eventNames } from '#controllers/instances/lib/subscribe'
import { isEntityUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { arrayIncludes } from '#lib/utils/base'
import { info } from '#lib/utils/logs'
import { federatedMode, remoteEntitiesOrigin } from '#server/config'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq, RemoteUserAuthentifiedReq } from '#types/server'

const sanitization = {
  event: {
    generic: 'allowlist',
    allowlist: eventNames,
  },
  uri: {},
} as const

async function controller (params: SanitizedParameters, req: AuthentifiedReq | RemoteUserAuthentifiedReq) {
  if (!federatedMode) throw newError('this endpoint is open only in federated mode', 403)

  if (!('remoteUser' in req)) {
    throw newError('expected request to be signed by a remote user', 403)
  }

  const { origin } = req.remoteUser

  if (origin !== remoteEntitiesOrigin) {
    throw newError('only the remote entities origin can post instance events', 403, { origin, remoteEntitiesOrigin })
  }

  const { event: eventName, uri } = params

  if (!(arrayIncludes(eventNames, eventName))) {
    throw newError('invalid event name', 400, { eventName })
  }

  if (!isEntityUri(uri)) throw newError('invalid entity uri', 400, { uri })

  info(params, 'received event from remote entities origin')

  await emit('entity:revert:merge', uri)

  return { ok: true }
}

export default { sanitization, controller }
