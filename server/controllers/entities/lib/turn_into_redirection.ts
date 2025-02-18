import { compact, pick, uniq } from 'lodash-es'
import { getInvClaimsByClaimValue, getEntityById, putInvEntityUpdate, wdEntityHasALocalLayer } from '#controllers/entities/lib/entities'
import { getClaimValue, hasLocalClaims } from '#controllers/entities/lib/inv_claims_utils'
import { removePlaceholder } from '#controllers/entities/lib/placeholders'
import { isInvEntityUri, isWdEntityUri } from '#lib/boolean_validations'
import type { UserWithAcct } from '#lib/federation/remote_user'
import { log } from '#lib/utils/logs'
import { convertEntityDocIntoARedirection, preventRedirectionEdit, convertEntityDocIntoALocalLayer, preventLocalLayerEdit, preventRemovedPlaceholderEdit } from '#models/entity'
import type { Claims, EntityUri, InvEntity, InvEntityId, InvEntityUri, PropertyUri } from '#types/entity'
import type { PatchContext } from '#types/patch'
import { propagateRedirection } from './propagate_redirection.js'

export async function turnIntoRedirectionOrLocalLayer ({ user, fromId, toUri, previousToUri, context }: { user: UserWithAcct, fromId: InvEntityId, toUri: EntityUri, previousToUri?: EntityUri, context?: PatchContext }) {
  const fromUri = `inv:${fromId}` as InvEntityUri

  const currentFromDoc = await getEntityById(fromId)
  preventRedirectionEdit(currentFromDoc)
  preventLocalLayerEdit(currentFromDoc)
  preventRemovedPlaceholderEdit(currentFromDoc)
  let updatedFromDoc
  if (isWdEntityUri(toUri) && hasLocalClaims(currentFromDoc) && !(await wdEntityHasALocalLayer(toUri))) {
    updatedFromDoc = convertEntityDocIntoALocalLayer(currentFromDoc, toUri)
  } else {
    // If an author has no more links to it, remove it
    const removedIds = await removeObsoletePlaceholderEntities(user, currentFromDoc)
    updatedFromDoc = convertEntityDocIntoARedirection(currentFromDoc, toUri, removedIds)
  }
  await putInvEntityUpdate({
    userAcct: user.acct,
    currentDoc: currentFromDoc,
    updatedDoc: updatedFromDoc,
    context,
  })
  return propagateRedirection(user.acct, fromUri, toUri, previousToUri)
}

// Removing the entities that were needed only by the entity about to be turned
// into a redirection: this entity now don't have anymore reason to be and is quite
// probably a duplicate of an existing entity referenced by the redirection
// destination entity.
async function removeObsoletePlaceholderEntities (user: UserWithAcct, entityDocBeforeRedirection: InvEntity) {
  const entityUrisToCheck = getEntityUrisToCheck(entityDocBeforeRedirection.claims)
  log(entityUrisToCheck, 'entity uris to check for autoremoval')
  const removedIds = await Promise.all(entityUrisToCheck.map(uri => deleteIfIsolated(user, entityDocBeforeRedirection._id, uri)))
  return compact(removedIds)
}

function getEntityUrisToCheck (claims: Claims): EntityUri[] {
  const uris = Object.values(pick(claims, propertiesToCheckForPlaceholderDeletion)).flat()
    .map(getClaimValue) as EntityUri[]
  return uniq(uris).filter(uri => isInvEntityUri(uri))
}

const propertiesToCheckForPlaceholderDeletion: PropertyUri[] = [
  // author
  'wdt:P50',
] as const

async function deleteIfIsolated (user: UserWithAcct, redirectedEntityId: InvEntityId, uri: EntityUri) {
  // Ignore wd or isbn entities
  if (!isInvEntityUri(uri)) return

  let results = await getInvClaimsByClaimValue(uri)
  results = results.filter(result => result.entity !== redirectedEntityId)
  // noRelatedClaimUpdate=true, because as results.length === 0, the only claim is to the redirected entity
  // and updating it would create an edit conflict with the update made by convertEntityDocIntoALocalLayer
  if (results.length === 0) return removePlaceholder(user, uri, { noRelatedClaimUpdate: true })
}
