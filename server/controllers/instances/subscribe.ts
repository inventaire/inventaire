import { recordSubscription } from '#controllers/instances/lib/events'
import { eventNames } from '#controllers/instances/lib/subscribe'
import { isEntityUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { arrayIncludes } from '#lib/utils/base'
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
  if (!('remoteUser' in req)) {
    throw newError('expected request to be signed by a remote user', 403)
  }

  const { remoteUser } = req
  const { event: eventName, uri } = params

  if (!(arrayIncludes(eventNames, eventName))) {
    throw newError('invalid event name', 400, { eventName })
  }
  if (!isEntityUri(uri)) {
    throw newError('invalid entity uri', 400, { uri })
  }

  const { origin } = remoteUser
  await recordSubscription(eventName, uri, origin)
  return { ok: true }
}

export default { sanitization, controller }
