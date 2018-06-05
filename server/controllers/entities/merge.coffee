__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getEntitiesByUris = require './lib/get_entities_by_uris'
{ merge:mergeEntities, turnIntoRedirection } = require './lib/merge_entities'
radio = __.require 'lib', 'radio'

# Assumptions:
# - ISBN are already desambiguated and should thus never need merge
#   out of the case of merging with an existing Wikidata edition entity
#   but those are ignored for the moment: not enough of them, data mixed with works, etc.
# - The merged entity data may be lost: the entity was probably a placeholder
#   what matter is the redirection. Or more fine, reconciling strategy can be developed later

# Only inv entities can be merged yet
validFromPrefix = [ 'inv', 'isbn' ]

module.exports = (req, res)->
  { body } = req
  { from:fromUri, to:toUri } = body
  { _id:reqUserId } = req.user

  unless fromUri? then return error_.bundleMissingBody req, res, 'from'
  unless toUri then return error_.bundleMissingBody req, res, 'to'

  # Not using _.isEntityUri, letting the logic hereafter check specific prefixes
  unless _.isNonEmptyString fromUri
    return error_.bundleInvalid req, res, 'from', fromUri

  unless _.isNonEmptyString toUri
    return error_.bundleInvalid req, res, 'to', toUri

  [ fromPrefix, fromId ] = fromUri.split ':'
  [ toPrefix, toId ] = toUri.split ':'

  unless fromPrefix in validFromPrefix
    message = "invalid 'from' uri domain: #{fromPrefix}. Accepted domains: #{validFromPrefix}"
    return error_.bundle req, res, message, 400, body

  # 'to' prefix doesn't need validation as it can be anything

  _.log { merge: body, user: reqUserId }, 'entity merge request'

  # Let getEntitiesByUris test for the whole URI validity
  # Get data from concerned entities
  getEntitiesByUris [ fromUri, toUri ], true
  .then Merge(reqUserId, toPrefix, fromUri, toUri)
  .then _.Ok(res)
  .then -> radio.emit 'entity:merge', fromUri, toUri
  .catch error_.Handler(req, res)

Merge = (reqUserId, toPrefix, fromUri, toUri)-> (res)->
  { entities, redirects } = res
  fromEntity = entities[fromUri] or entities[redirects[fromUri]]
  unless fromEntity? then throw notFound 'from', fromUri

  toEntity = entities[toUri] or entities[redirects[toUri]]
  unless toEntity? then throw notFound 'to', toUri

  unless fromEntity.type is toEntity.type
    # Exception: authors can be organizations and collectives of all kinds
    # which will not get a 'human' type
    unless fromEntity.type is 'human' and not toEntity.type?
      message = "type don't match: #{fromEntity.type} / #{toEntity.type}"
      throw error_.new message, 400, fromUri, toUri

  # Merging editions with ISBNs should only happen in the rare case
  # where the uniqueness check failed because two entities with the same ISBN
  # were created at about the same time. Other cases should be rejected.
  if fromEntity.type is 'edition'
    fromEntityIsbn = fromEntity.claims['wdt:P212']?[0]
    toEntityIsbn = toEntity.claims['wdt:P212']?[0]
    if fromEntityIsbn? and toEntityIsbn? and fromEntityIsbn isnt toEntityIsbn
      throw error_.new "can't merge editions with different ISBNs", 400, fromUri, toUri

  [ fromPrefix, fromId ] = fromUri.split ':'
  [ toPrefix, toId ] = toUri.split ':'

  if toPrefix is 'wd'
    # no merge to do for Wikidata entities, simply creating a redirection
    return turnIntoRedirection reqUserId, fromId, toUri

  fromInvId = fromEntity._id
  toInvId = toEntity._id
  # Passing both the inv ids (that will be required to fetch docs in the db)
  # and the canonical URIs (required to propagate redirections)
  return mergeEntities { userId: reqUserId, fromInvId, toInvId, fromUri, toUri }

notFound = (label, context)->
  error_.new "'#{label}' entity not found", 400, context
