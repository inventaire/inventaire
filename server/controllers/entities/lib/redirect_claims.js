// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const entities_ = require('./entities')
const Entity = __.require('models', 'entity')

module.exports = (userId, fromUri, toUri) => entities_.byClaimsValue(fromUri)
.then(results => {
  const entitiesToEditIds = _.map(results, 'entity')
  _.log(entitiesToEditIds, 'entitiesToEditIds')
  if (entitiesToEditIds.length === 0) return
  // Doing all the redirects at once to avoid conflicts
  // within a same entity pointing several times to the redirected entity.
  // There is no identified case at the moment though.
  return entities_.byIds(entitiesToEditIds)
  .then(redirectEntitiesClaims(results, userId, fromUri, toUri))
})

const redirectEntitiesClaims = (results, userId, fromUri, toUri) => entities => {
  const entitiesIndex = _.keyBy(entities, '_id')
  const entitiesIndexBeforeUpdate = _.cloneDeep(entitiesIndex)

  // Apply all the redirection updates on the entities docs
  results.forEach(applyRedirections(entitiesIndex, fromUri, toUri))

  // Then, post the updates all at once
  const updatesPromises = _.values(entitiesIndex).map(updatedDoc => {
    const currentDoc = entitiesIndexBeforeUpdate[updatedDoc._id]
    // Add a context in case we need to revert those redirections later on
    const context = { redirectClaims: { fromUri } }
    return entities_.putUpdate({ userId, currentDoc, updatedDoc, context })
  })

  return promises_.all(updatesPromises)
}

const applyRedirections = (entitiesIndex, fromUri, toUri) => result => {
  let newVal
  const { property, entity } = result
  const doc = entitiesIndex[entity]

  // If the toUri is already a claim value, delete the fromUri claim
  // instead of creating a duplicated claim
  if (doc.claims[property].includes(toUri)) {
    newVal = null
  } else {
    newVal = toUri
  }

  entitiesIndex[entity] = Entity.updateClaim(doc, property, fromUri, newVal)
}
