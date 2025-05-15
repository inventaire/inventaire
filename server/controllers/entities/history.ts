// An endpoint to get entities history as snapshots and diffs
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { getPatchesWithSnapshots } from '#controllers/entities/lib/patches/patches'
import { unprefixify } from '#controllers/entities/lib/prefix'
import { isInvEntityUri } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { parseReqLocalOrRemoteUser } from '#lib/federation/remote_user'
import { hasAdminAccess } from '#lib/user_access_levels'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { EntityUri } from '#types/entity'
import type { AuthentifiedReq, RemoteUserAuthentifiedReq } from '#types/server'
import { anonymizePatches } from './lib/anonymize_patches.js'

const sanitization = {
  id: {
    optional: true,
  },
  uri: {
    optional: true,
  },
} as const

async function controller (params: SanitizedParameters, req: AuthentifiedReq | RemoteUserAuthentifiedReq) {
  const { uri, reqUserAcct } = params
  let { id } = params

  if (!(id || uri)) throw newError('either a uri or an id is required', 400, params)

  if (uri) {
    if (isInvEntityUri(uri)) {
      id = unprefixify(uri)
    } else {
      id = await getInvIdFromUri(uri)
    }
  }
  let patches
  if (id) {
    const user = parseReqLocalOrRemoteUser(req)
    patches = await getPatchesWithSnapshots(id)
    if (!hasAdminAccess(user)) await anonymizePatches({ patches, reqUserAcct })
  } else {
    // If no inv id is found for a given uri, there is no local layer for that entity
    // thus no patches
    patches = []
  }
  return { patches }
}

async function getInvIdFromUri (uri: EntityUri) {
  // Easiest way to resolve isbn and wd uris to a potential wd entity with a local layer
  // but there might be a more efficient way to do it
  // The history endpoint not being on a hot path, that should be fine to stay sub-optimized
  const entity = await getEntityByUri({ uri })
  return entity.invId
}

export default { sanitization, controller }
