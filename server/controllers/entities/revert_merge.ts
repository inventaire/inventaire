import { isInvEntityId } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { parseReqLocalOrRemoteUser } from '#lib/federation/remote_user'
import { emit } from '#lib/radio'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { AuthentifiedReq } from '#types/server'
import revertMerge from './lib/revert_merge.js'

const sanitization = {
  from: {},
}

async function controller (params: SanitizedParameters, req: AuthentifiedReq) {
  const { from: fromUri } = params
  const user = parseReqLocalOrRemoteUser(req)
  const [ fromPrefix, fromId ] = fromUri.split(':')

  if ((fromPrefix !== 'inv') || !isInvEntityId(fromId)) {
    const message = `invalid 'from' uri domain: ${fromPrefix}. Accepted domains: inv`
    throw newError(message, 400, params)
  }

  const { updateRes, toUri } = await revertMerge(user, fromId)
  await emit('entity:revert:merge', fromUri, toUri)
  return updateRes
}

export default { sanitization, controller }
