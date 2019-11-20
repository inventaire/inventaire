
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const getEntitiesByUris = require('./lib/get_entities_by_uris')
const mergeEntities = require('./lib/merge_entities')
const radio = __.require('lib', 'radio')

// Assumptions:
// - ISBN are already desambiguated and should thus never need merge
//   out of the case of merging with an existing Wikidata edition entity
//   but those are ignored for the moment: not enough of them, data mixed with works, etc.
// - The merged entity data may be lost: the entity was probably a placeholder
//   what matters the most is the redirection. Or more fine, reconciling strategy can be developed later

// Only inv entities can be merged yet
const validFromPrefix = [ 'inv', 'isbn' ]

module.exports = (req, res) => {
  const { body } = req
  const { from: fromUri, to: toUri } = body
  const { _id: reqUserId } = req.user

  if (fromUri == null) return error_.bundleMissingBody(req, res, 'from')
  if (!toUri) return error_.bundleMissingBody(req, res, 'to')

  // Not using _.isEntityUri, letting the logic hereafter check specific prefixes
  if (!_.isNonEmptyString(fromUri)) {
    return error_.bundleInvalid(req, res, 'from', fromUri)
  }

  if (!_.isNonEmptyString(toUri)) {
    return error_.bundleInvalid(req, res, 'to', toUri)
  }

  const [ fromPrefix ] = fromUri.split(':')
  const [ toPrefix ] = toUri.split(':')

  if (!validFromPrefix.includes(fromPrefix)) {
    const message = `invalid 'from' uri domain: ${fromPrefix}. Accepted domains: ${validFromPrefix}`
    return error_.bundle(req, res, message, 400, body)
  }

  // 'to' prefix doesn't need validation as it can be anything

  _.log({ merge: body, user: reqUserId }, 'entity merge request')

  // Let getEntitiesByUris test for the whole URI validity
  return getEntitiesByUris({ uris: [ fromUri, toUri ], refresh: true })
  .then(merge(reqUserId, toPrefix, fromUri, toUri))
  .tap(() => radio.emit('entity:merge', fromUri, toUri))
  .then(responses_.Ok(res))
  .catch(error_.Handler(req, res))
}

const merge = (reqUserId, toPrefix, fromUri, toUri) => res => {
  const { entities, redirects } = res
  const fromEntity = entities[fromUri] || entities[redirects[fromUri]]
  if (fromEntity == null) throw notFound('from', fromUri)

  const toEntity = entities[toUri] || entities[redirects[toUri]]
  if (toEntity == null) throw notFound('to', toUri)

  if (fromEntity.uri !== fromUri) {
    throw error_.new("'from' entity is already a redirection", 400, { fromUri, toUri })
  }

  if (toEntity.uri !== toUri) {
    throw error_.new("'to' entity is already a redirection", 400, { fromUri, toUri })
  }

  if (fromEntity.uri === toEntity.uri) {
    throw error_.new("can't merge an entity into itself", 400, { fromUri, toUri })
  }

  if (fromEntity.type !== toEntity.type) {
    // Exception: authors can be organizations and collectives of all kinds
    // which will not get a 'human' type
    if ((fromEntity.type !== 'human') || !(toEntity.type == null)) {
      const message = `type don't match: ${fromEntity.type} / ${toEntity.type}`
      throw error_.new(message, 400, fromUri, toUri)
    }
  }

  // Merging editions with ISBNs should only happen in the rare case
  // where the uniqueness check failed because two entities with the same ISBN
  // were created at about the same time. Other cases should be rejected.
  if (fromEntity.type === 'edition') {
    const fromEntityIsbn = fromEntity.claims['wdt:P212'] != null ? fromEntity.claims['wdt:P212'][0] : undefined
    const toEntityIsbn = toEntity.claims['wdt:P212'] != null ? toEntity.claims['wdt:P212'][0] : undefined
    if ((fromEntityIsbn != null) && (toEntityIsbn != null) && (fromEntityIsbn !== toEntityIsbn)) {
      throw error_.new("can't merge editions with different ISBNs", 400, fromUri, toUri)
    }
  }

  fromUri = replaceIsbnUriByInvUri(fromUri, fromEntity._id)
  toUri = replaceIsbnUriByInvUri(toUri, toEntity._id)

  return mergeEntities(reqUserId, fromUri, toUri)
}

const replaceIsbnUriByInvUri = (uri, invId) => {
  const [ prefix ] = uri.split(':')
  // Prefer inv id over isbn to prepare for ./lib/merge_entities
  if (prefix === 'isbn') return `inv:${invId}`
  return uri
}

const notFound = (label, context) => error_.new(`'${label}' entity not found`, 400, context)
