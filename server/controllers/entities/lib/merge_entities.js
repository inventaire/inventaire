const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('lib', 'utils/assert_types')
const entities_ = require('./entities')
const Entity = __.require('models', 'entity')
const turnIntoRedirection = require('./turn_into_redirection')
const getInvEntityCanonicalUri = require('./get_inv_entity_canonical_uri')

module.exports = ({ userId, fromUri, toUri, context }) => {
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
    return turnIntoRedirection({ userId, fromId, toUri, context })
  } else {
    // TODO: invert fromId and toId if the merged entity is more popular
    // to reduce the amount of documents that need to be updated
    return mergeInvEntities(userId, fromId, toId, context)
  }
}

const mergeInvEntities = async (userId, fromId, toId) => {
  assert_.strings([ userId, fromId, toId ])

  // Fetching non-formmatted docs
  const [ fromEntityDoc, toEntityDoc ] = await entities_.byIds([ fromId, toId ])
  // At this point if the entities are not found, that's the server's fault,
  // thus the 500 statusCode
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
  const toEntityDocAfterMerge = Entity.mergeDocs(fromEntityDoc, toEntityDoc)

  // If the doc hasn't changed, don't run entities_.putUpdate
  // as it will throw an 'empty patch' error
  if (!_.isEqual(toEntityDocBeforeMerge, toEntityDocAfterMerge)) {
    await entities_.putUpdate({
      userId,
      currentDoc: toEntityDocBeforeMerge,
      updatedDoc: toEntityDocAfterMerge,
      context: { mergeFrom: `inv:${fromId}` }
    })
  }

  // Refresh the URI in case an ISBN was transfered and the URI changed
  const toUri = getInvEntityCanonicalUri(toEntityDocAfterMerge)

  return turnIntoRedirection({ userId, fromId, toUri, previousToUri })
}
