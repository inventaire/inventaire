import { recordSubscription } from '#controllers/instances/lib/events'
import { eventNames } from '#controllers/instances/lib/subscribe'
import { newError } from '#lib/error/error'
import { federatedMode } from '#server/config'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq, RemoteUserAuthentifiedReq } from '#types/server'

const sanitization = {
  event: {
    generic: 'allowlist',
    allowlist: eventNames,
  },
  uris: {},
} as const

async function controller (params: SanitizedParameters, req: AuthentifiedReq | RemoteUserAuthentifiedReq) {
  if (federatedMode) throw newError('this endpoint is open only in non-federated mode', 403)

  if (!('remoteUser' in req)) {
    throw newError('expected request to be signed by a remote user', 403)
  }

  const { origin } = req.remoteUser
  const { event: eventName, uris } = params

  for (const uri of uris) {
    await recordSubscription(eventName, uri, origin)
  }
  return { ok: true }
}

export default { sanitization, controller }
