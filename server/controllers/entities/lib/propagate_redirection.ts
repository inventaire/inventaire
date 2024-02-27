import { redirectCachedRelations } from '#controllers/entities/lib/temporarily_cache_relations'
import updateItemEntity from '#controllers/items/lib/update_entity'
import { updateElementsUris } from '#controllers/listings/lib/update_element_uri'
import { redirectClaims } from './redirect_claims.js'

export default (userId, fromUri, toUri, previousToUri) => {
  const actions = [
    redirectClaims(userId, fromUri, toUri),
    updateItemEntity.afterMerge(fromUri, toUri),
    redirectCachedRelations(fromUri, toUri),
    updateElementsUris(fromUri, toUri),
  ]

  if (previousToUri && toUri !== previousToUri) {
    actions.push(updateItemEntity.afterMerge(previousToUri, toUri))
  }

  return Promise.all(actions)
}