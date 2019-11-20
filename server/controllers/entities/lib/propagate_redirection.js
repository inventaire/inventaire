
/*
 * decaffeinate suggestions:
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const promises_ = __.require('lib', 'promises')
const redirectClaims = require('./redirect_claims')
const updateItemEntity = __.require('controllers', 'items/lib/update_entity')

module.exports = (userId, fromUri, toUri, previousToUri) => {
  const actions = [
    redirectClaims(userId, fromUri, toUri),
    updateItemEntity.afterMerge(fromUri, toUri)
  ]

  if ((previousToUri != null) && (toUri !== previousToUri)) {
    actions.push(updateItemEntity.afterMerge(previousToUri, toUri))
  }

  return promises_.all(actions)
}
