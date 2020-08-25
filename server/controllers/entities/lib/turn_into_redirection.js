const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const entities_ = require('./entities')
const Entity = __.require('models', 'entity')
const placeholders_ = require('./placeholders')
const propagateRedirection = require('./propagate_redirection')

module.exports = (userId, fromId, toUri, previousToUri) => {
  assert_.strings([ userId, fromId, toUri ])
  if (previousToUri != null) { assert_.string(previousToUri) }

  const fromUri = `inv:${fromId}`

  return entities_.byId(fromId)
  .then(currentFromDoc => {
    Entity.preventRedirectionEdit(currentFromDoc, 'turnIntoRedirection')
    // If an author has no more links to it, remove it
    return removeObsoletePlaceholderEntities(userId, currentFromDoc)
    .then(removedIds => {
      const updatedFromDoc = Entity.turnIntoRedirection(currentFromDoc, toUri, removedIds)
      return entities_.putUpdate({
        userId,
        currentDoc: currentFromDoc,
        updatedDoc: updatedFromDoc
      })
    })
  })
  .then(propagateRedirection.bind(null, userId, fromUri, toUri, previousToUri))
}

// Removing the entities that were needed only by the entity about to be turned
// into a redirection: this entity now don't have anymore reason to be and is quite
// probably a duplicate of an existing entity referenced by the redirection
// destination entity.
const removeObsoletePlaceholderEntities = (userId, entityDocBeforeRedirection) => {
  const entityUrisToCheck = getEntityUrisToCheck(entityDocBeforeRedirection.claims)
  _.log(entityUrisToCheck, 'entityUrisToCheck')
  const fromId = entityDocBeforeRedirection._id
  return Promise.all(entityUrisToCheck.map(deleteIfIsolated(userId, fromId)))
  // Returning removed docs ids
  .then(_.compact)
}

const getEntityUrisToCheck = claims => {
  return _(claims)
  .pick(propertiesToCheckForPlaceholderDeletion)
  .values()
  // Merge properties arrays
  .flatten()
  .uniq()
  .value()
}

const propertiesToCheckForPlaceholderDeletion = [
  // author
  'wdt:P50'
]

const deleteIfIsolated = (userId, fromId) => async entityUri => {
  const [ prefix, entityId ] = entityUri.split(':')
  // Ignore wd or isbn entities
  if (prefix !== 'inv') return

  let results = await entities_.byClaimsValue(entityUri)
  results = results.filter(result => result.entity !== fromId)
  if (results.length === 0) return placeholders_.remove(userId, entityId)
}
