import { eventNames } from '#controllers/instances/lib/subscribe'
import { isEntityUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { arrayIncludes } from '#lib/utils/base'
import { info } from '#lib/utils/logs'
import { remoteEntitiesOrigin } from '#server/config'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq, RemoteUserAuthentifiedReq } from '#types/server'

const sanitization = {
  event: {
    generic: 'allowlist',
    allowlist: eventNames,
  },
  from: {},
  to: {},
} as const

async function controller (params: SanitizedParameters, req: AuthentifiedReq | RemoteUserAuthentifiedReq) {
  if (!('remoteUser' in req)) {
    throw newError('expected request to be signed by a remote user', 403)
  }

  const { origin } = req.remoteUser

  if (origin !== remoteEntitiesOrigin) {
    throw newError('only the remote entities origin can post instance events', 403, { origin, remoteEntitiesOrigin })
  }

  const { event: eventName, from: fromUri, to: toUri } = params

  if (!(arrayIncludes(eventNames, eventName))) {
    throw newError('invalid event name', 400, { eventName })
  }

  if (!isEntityUri(fromUri)) throw newError('invalid entity uri', 400, { fromUri })
  if (!isEntityUri(toUri)) throw newError('invalid entity uri', 400, { toUri })

  info(params, 'received event from remote entities origin')

  await emit('entity:revert:merge', fromUri, toUri)

  return { ok: true }
}

export default { sanitization, controller }
