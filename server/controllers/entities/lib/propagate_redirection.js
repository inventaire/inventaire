import updateItemEntity from '#controllers/items/lib/update_entity'
import redirectClaims from './redirect_claims.js'

export default (userId, fromUri, toUri, previousToUri) => {
  const actions = [
    redirectClaims(userId, fromUri, toUri),
    updateItemEntity.afterMerge(fromUri, toUri)
  ]

  if (previousToUri && toUri !== previousToUri) {
    actions.push(updateItemEntity.afterMerge(previousToUri, toUri))
  }

  return Promise.all(actions)
}
