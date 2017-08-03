__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
getEntitiesByUris = require './lib/get_entities_by_uris'
entities_ = require './lib/entities'
patches_ = require './lib/patches'
updateInvClaim = require './update_inv_claim'
placeholders_ = require './lib/placeholders'
# Other types should be redirected instead of removed
# so that the associated items follow
whitelistedTypes = [ 'human' ]

module.exports = (req, res, next)->
  { user } = req
  { uris } = req.query

  unless _.isNonEmptyString uris
    return error_.bundleMissingQuery req, res, 'uris'

  uris = _.uniq uris.split('|')

  for uri in uris
    unless _.isInvEntityUri(uri)
      return error_.bundleInvalid req, res, 'uri', uri

  verifyThatEntitiesCanBeRemoved uris
  .then -> removeEntitiesByInvId user, uris
  .then _.Ok(res)
  .catch error_.Handler(req, res)

verifyThatEntitiesCanBeRemoved = (uris)->
  Promise.all [
    entitiesAreOfAWhitelistedType uris
    entitisArentUsedInMoreThanOneClaim uris
  ]

entitiesAreOfAWhitelistedType = (uris)->
  getEntitiesByUris uris
  .then (res)->
    for uri, entity of res.entities
      { type } = entity
      if type not in whitelistedTypes
        throw error_.new "entities of type '#{type}' can't be removed", 400, uri

entitisArentUsedInMoreThanOneClaim = (uris)->
  Promise.all uris.map entityIsntUsedInMoreThanOneClaim

entityIsntUsedInMoreThanOneClaim = (uri)->
  entities_.byClaimsValue uri
  .then (claims)->
    if claims.length > 1
      throw error_.new 'this entity has too many claims to be removed', 400, uri, claims

removeEntitiesByInvId = (user, uris)->
  ids = uris.map unprefixify

  Promise.all [
    removeEntities user._id, ids
    deleteUrisValueClaims(user, uris)
  ]

unprefixify = (uri)-> uri.split(':')[1]

# Turning deleted entities into removed:placeholder as it as largely the same effect
# as deleting (not indexed by views any more) but it's reversible, and already
# understood by other services, that will either unindex it (search engine updater)
# or ignore it (client)
removeEntities = (reqUserId, ids)->
  Promise.all ids.map(placeholders_.remove.bind(null, reqUserId))

deleteUrisValueClaims = (user, uris)->
  Promise.all uris.map(deleteUriValueClaims(user))

deleteUriValueClaims = (user)-> (uri)->
  entities_.byClaimsValue uri
  .map (claimData)->
    { entity:id, property } = claimData
    return updateInvClaim user, id, property, uri, null
