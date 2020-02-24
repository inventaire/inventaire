const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const entities_ = require('./entities')
const Entity = __.require('models', 'entity')
const placeholders_ = require('./placeholders')
const propagateRedirection = require('./propagate_redirection')
const getInvEntityCanonicalUri = require('./get_inv_entity_canonical_uri')

module.exports = (userId, fromUri, toUri) => {
  let [ fromPrefix, fromId ] = fromUri.split(':')
  let [ toPrefix, toId ] = toUri.split(':')

  if (fromPrefix === 'wd') {
    if (toPrefix === 'inv') {
      _.info({ fromUri, toUri }, 'merge: switching fromUri and toUri');
      [ fromPrefix, fromId, toPrefix, toId ] = [ toPrefix, toId, fromPrefix, fromId ]
    } else {
      throw error_.new('cannot merge wd entites', 500, { fromUri, toUri })
    }
  }

  if (toPrefix === 'wd') {
    // no merge to do for Wikidata entities, simply creating a redirection
    return turnIntoRedirection(userId, fromId, toUri)
  } else {
    // TODO: invert fromId and toId if the merged entity is more popular
    // to reduce the amount of documents that need to be updated
    return mergeEntities(userId, fromId, toId)
  }
}

const mergeEntities = (userId, fromId, toId) => {
  assert_.strings([ userId, fromId, toId ])

  // Fetching non-formmatted docs
  return entities_.byIds([ fromId, toId ])
  .then(([ fromEntityDoc, toEntityDoc ]) => {
    // At this point if the entities are not found, that's the server's fault,
    // thus the 500 statusCode
    let transfer
    if (fromEntityDoc._id !== fromId) {
      throw error_.new("'from' entity doc not found", 500)
    }

    if (toEntityDoc._id !== toId) {
      throw error_.new("'to' entity doc not found", 500)
    }

    const previousToUri = getInvEntityCanonicalUri(toEntityDoc)

    // Transfer all data from the 'fromEntity' to the 'toEntity'
    // if any difference can be found
    const toEntityDocBeforeMerge = _.cloneDeep(toEntityDoc)
    toEntityDoc = Entity.mergeDocs(fromEntityDoc, toEntityDoc)
    if (_.isEqual(toEntityDoc, toEntityDocBeforeMerge)) {
      // if the toEntityDoc after data transfer hasn't changed
      // don't run entities_.putUpdate as it will throw an 'empty patch' error
      transfer = Promise.resolve()
    } else {
      transfer = entities_.putUpdate({
        userId,
        currentDoc: toEntityDocBeforeMerge,
        updatedDoc: toEntityDoc,
        context: { mergeFrom: `inv:${fromId}` }
      })
    }

    // Refresh the URI in case an ISBN was transfered and the URI changed
    const newToUri = getInvEntityCanonicalUri(toEntityDoc)

    return transfer
    .then(() => turnIntoRedirection(userId, fromId, newToUri, previousToUri))
  })
}

const turnIntoRedirection = (userId, fromId, toUri, previousToUri) => {
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

const deleteIfIsolated = (userId, fromId) => entityUri => {
  const [ prefix, entityId ] = entityUri.split(':')
  // Ignore wd or isbn entities
  if (prefix !== 'inv') return

  return entities_.byClaimsValue(entityUri)
  .filter(result => result.entity !== fromId)
  .then(results => {
    if (results.length === 0) return placeholders_.remove(userId, entityId)
  })
}
