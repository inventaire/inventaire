import { uniq } from 'lodash-es'
import { replaceIsbnUrisByInvUris, validateUris } from '#controllers/entities/delete'
import { recoverPlaceholders } from '#controllers/entities/lib/revert_merge'
import { parseReqLocalOrRemoteUser } from '#lib/federation/remote_user'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { EntityUri, InvEntityUri } from '#types/entity'
import type { AuthentifiedReq, RemoteUserAuthentifiedReq } from '#types/server'

const sanitization = {
  uris: {},
}

async function controller (params: SanitizedParameters, req: AuthentifiedReq | RemoteUserAuthentifiedReq) {
  const user = parseReqLocalOrRemoteUser(req)
  const uris: EntityUri[] = uniq(params.uris)
  validateUris(uris)
  const invUris: InvEntityUri[] = await replaceIsbnUrisByInvUris(uris, { includeRemovedPlaceholders: true })
  await recoverPlaceholders(user, invUris)
  return { ok: true }
}

export default { sanitization, controller }
