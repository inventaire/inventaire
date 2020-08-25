const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const entities_ = require('./entities')
const Entity = __.require('models', 'entity')
const placeholders_ = require('./placeholders')
const propagateRedirection = require('./propagate_redirection')

module.exports = async ({ userId, fromId, toUri, previousToUri }) => {
  assert_.strings([ userId, fromId, toUri ])
  if (previousToUri != null) assert_.string(previousToUri)

  const fromUri = `inv:${fromId}`

  const currentFromDoc = await entities_.byId(fromId)
  Entity.preventRedirectionEdit(currentFromDoc, 'turnIntoRedirection')
  // If an author has no more links to it, remove it
  const removedIds = await removeObsoletePlaceholderEntities(userId, currentFromDoc)
  const updatedFromDoc = Entity.turnIntoRedirection(currentFromDoc, toUri, removedIds)
  await entities_.putUpdate({
    userId,
    currentDoc: currentFromDoc,
    updatedDoc: updatedFromDoc
  })
  return propagateRedirection(userId, fromUri, toUri, previousToUri)
}

// Removing the entities that were needed only by the entity about to be turned
// into a redirection: this entity now don't have anymore reason to be and is quite
// probably a duplicate of an existing entity referenced by the redirection
// destination entity.
const removeObsoletePlaceholderEntities = async (userId, entityDocBeforeRedirection) => {
  const entityUrisToCheck = getEntityUrisToCheck(entityDocBeforeRedirection.claims)
  _.log(entityUrisToCheck, 'entityUrisToCheck')
  const fromId = entityDocBeforeRedirection._id
  const removedIds = await Promise.all(entityUrisToCheck.map(deleteIfIsolated(userId, fromId)))
  return _.compact(removedIds)
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
