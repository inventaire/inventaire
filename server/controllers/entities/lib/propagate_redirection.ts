import { redirectCachedRelations } from '#controllers/entities/lib/temporarily_cache_relations'
import { updateItemsEntityAfterMerge, updateItemsEntityAfterMergeRevert } from '#controllers/items/lib/update_entity'
import { updateElementsUrisAfterMerge, updateElementsUrisAfterMergeRevert } from '#controllers/listings/lib/update_element_uri'
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
    updateItemsEntityAfterMerge(fromUri, toUri),
    updateElementsUrisAfterMerge(fromUri, toUri),
  ])
}

export async function propagateRedirectionRevertToSocialCore (fromUri: EntityUri) {
  await Promise.all([
    updateItemsEntityAfterMergeRevert(fromUri),
    updateElementsUrisAfterMergeRevert(fromUri),
  ])
}

radio.on('entity:revert:merge', propagateRedirectionRevertToSocialCore)
