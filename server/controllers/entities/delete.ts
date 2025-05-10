import { partition, uniq } from 'lodash-es'
import { getInvEntitiesByIsbns, getRemovedPlaceholdersByIsbns } from '#controllers/entities/lib/entities'
import { removeOrCreateOrUpdateTasks } from '#controllers/tasks/lib/remove_or_create_tasks'
import { isInvEntityUri, isWdEntityUri } from '#lib/boolean_validations'
import { newInvalidError } from '#lib/error/pre_filled'
import { parseReqLocalOrRemoteUser } from '#lib/federation/remote_user'
import { hasDataadminAccess } from '#lib/user_access_levels'
import type { SanitizedParameters } from '#types/controllers_input_sanitization_parameters'
import type { EntityUri, InvEntityUri, IsbnEntityUri } from '#types/entity'
import type { AuthentifiedReq, RemoteUserAuthentifiedReq } from '#types/server'
import { removeEntitiesByInvId } from './lib/remove_entities_by_inv_id.js'
import { verifyThatEntitiesCanBeRemoved } from './lib/verify_that_entities_can_be_removed.js'

const sanitization = {
  uris: {},
} as const

async function controller (params: SanitizedParameters, req: AuthentifiedReq | RemoteUserAuthentifiedReq) {
  const user = parseReqLocalOrRemoteUser(req)
  const uris: EntityUri[] = uniq(params.uris)
  validateUris(uris)
  const invUris: InvEntityUri[] = await replaceIsbnUrisByInvUris(uris)
  const isDataadmin = hasDataadminAccess(user)

  await verifyThatEntitiesCanBeRemoved(invUris)
  if (isDataadmin) {
    await removeEntitiesByInvId(user, invUris)
  } else {
    await removeOrCreateOrUpdateTasks(user, invUris)
  }
  return { ok: true }
}

export function validateUris (uris: EntityUri[]): asserts uris is (InvEntityUri | IsbnEntityUri)[] {
  for (const uri of uris) {
    // Wikidata entities can't be deleted
    if (isWdEntityUri(uri)) throw newInvalidError('uri', uri)
  }
}

export async function replaceIsbnUrisByInvUris (uris: (InvEntityUri | IsbnEntityUri)[], options = { includeRemovedPlaceholders: false }) {
  const { includeRemovedPlaceholders } = options
  const [ invUris, isbnUris ] = partition(uris, isInvEntityUri) as [ InvEntityUri[], IsbnEntityUri[] ]
  if (isbnUris.length === 0) return invUris

  const substitutedUris = await getInvUrisFromIsbnUris(isbnUris, includeRemovedPlaceholders)
  return [ ...invUris, ...substitutedUris ] as InvEntityUri[]
}

async function getInvUrisFromIsbnUris (uris: IsbnEntityUri[], includeRemovedPlaceholders = false) {
  const isbns = uris.map(uri => uri.split(':')[1])
  const entities = await getInvEntitiesByIsbns(isbns)
  let removedPlaceholders
  if (includeRemovedPlaceholders) {
    removedPlaceholders = await getRemovedPlaceholdersByIsbns(isbns)
  } else {
    removedPlaceholders = []
  }
  return [ ...entities, ...removedPlaceholders ].map(entity => `inv:${entity._id}`)
}

export default { sanitization, controller }
