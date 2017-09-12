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
validFromPrefix = [ 'inv' ]

module.exports = (req, res)->
  { body } = req
  { from:fromUri, to:toUri } = body
  { _id:reqUserId } = req.user

  # Not using _.isEntityUri, letting the logic hereafter check specific prefixes
  unless _.isNonEmptyString fromUri
    return error_.bundleMissingBody req, res, 'from'

  unless _.isNonEmptyString toUri
    return error_.bundleMissingBody req, res, 'to'

  [ fromPrefix, fromId ] = fromUri.split ':'
  [ toPrefix, toId ] = toUri.split ':'

  unless fromPrefix in validFromPrefix
    return error_.bundle req, res, "invalid 'from' uri domain: #{fromPrefix}. Accepted domains: #{validFromPrefix}", 400, body

  # 'to' prefix doesn't need validation as it can be anything

  _.log { merge: body, user: reqUserId }, 'entity merge request'

  # Let getEntitiesByUris test for the whole URI validity
  # Get data from concerned entities
  getEntitiesByUris [ fromUri, toUri ], true
  .get 'entities'
  .then Merge(reqUserId, toPrefix, fromUri, toUri)
  .then _.Ok(res)
  .then -> radio.emit 'entity:merge', fromUri, toUri
  .catch error_.Handler(req, res)

Merge = (reqUserId, toPrefix, fromUri, toUri)-> (entitiesByUri)->
  fromEntity = entitiesByUri[fromUri]
  unless fromEntity? then throw notFound 'from', fromUri

  toEntity = entitiesByUri[toUri]
  unless toEntity? then throw notFound 'to', toUri

  unless fromEntity.type is toEntity.type
    # Exception: authors can be organizations and collectives of all kinds
    # which will not get a 'human' type
    unless fromEntity.type is 'human' and not toEntity.type?
      throw error_.new "type don't match: #{fromEntity.type} / #{toEntity.type}", 400, fromUri, toUri

  [ fromPrefix, fromId ] = fromUri.split ':'
  [ toPrefix, toId ] = toUri.split ':'

  if toPrefix is 'inv'
    return mergeEntities reqUserId, fromId, toId
  else
    # no merge to do for Wikidata entities, simply creating a redirection
    return turnIntoRedirection reqUserId, fromId, toUri

notFound = (label, context)->
  error_.new "'#{label}' entity not found (could it be not it's canonical uri?)", 400, context
