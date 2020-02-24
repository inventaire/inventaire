const __ = require('config').universalPath
const redirectClaims = require('./redirect_claims')
const updateItemEntity = __.require('controllers', 'items/lib/update_entity')

module.exports = (userId, fromUri, toUri, previousToUri) => {
  const actions = [
    redirectClaims(userId, fromUri, toUri),
    updateItemEntity.afterMerge(fromUri, toUri)
  ]

  if (previousToUri && toUri !== previousToUri) {
    actions.push(updateItemEntity.afterMerge(previousToUri, toUri))
  }

  return Promise.all(actions)
}
