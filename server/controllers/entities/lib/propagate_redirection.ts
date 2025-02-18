import { redirectCachedRelations } from '#controllers/entities/lib/temporarily_cache_relations'
import updateItemEntity from '#controllers/items/lib/update_entity'
import { updateElementsUris } from '#controllers/listings/lib/update_element_uri'
import { radio } from '#lib/radio'
import type { EntityUri } from '#types/entity'
import type { UserAccountUri } from '#types/server'
import { redirectClaims } from './redirect_claims.js'

export async function propagateRedirection (userAcct: UserAccountUri, fromUri: EntityUri, toUri: EntityUri, previousToUri?: EntityUri) {
  const actions = [
    propagateRedirectionToSocialCore(fromUri, toUri),
    redirectClaims(userAcct, fromUri, toUri),
    redirectCachedRelations(fromUri, toUri),
  ]

  if (previousToUri && toUri !== previousToUri) {
    actions.push(propagateRedirectionToSocialCore(previousToUri, toUri))
  }

  return Promise.all(actions)
}

export async function propagateRedirectionToSocialCore (fromUri: EntityUri, toUri: EntityUri) {
  await Promise.all([
    updateItemEntity.afterMerge(fromUri, toUri),
    updateElementsUris(fromUri, toUri),
  ])
}

export async function propagateRedirectionRevertToSocialCore (fromUri: EntityUri, toUri: EntityUri) {
  await Promise.all([
    updateItemEntity.afterRevert(fromUri, toUri),
    // TODO: implement listing revert merge
    // updateElementsUris(fromUri, toUri),
  ])
}

radio.on('entity:revert:merge', propagateRedirectionRevertToSocialCore)
