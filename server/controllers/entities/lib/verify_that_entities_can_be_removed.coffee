__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
getEntitiesByUris = require './lib/get_entities_by_uris'
entities_ = require './lib/entities'

# Other types should be redirected instead of removed
# so that the associated items follow
whitelistedTypes = [ 'human', 'work' ]

criticalClaimProperties = [
  # no edition should end up without an associated work because of a removed work
  'wdt:P629'
]

module.exports = (uris)->
  Promise.all [
    entitiesAreOfAWhitelistedType uris
    entitiesArentMuchUsed uris
  ]

entitiesAreOfAWhitelistedType = (uris)->
  getEntitiesByUris uris
  .then (res)->
    for uri, entity of res.entities
      { type } = entity
      if type not in whitelistedTypes
        throw error_.new "entities of type '#{type}' can't be removed", 400, uri

entitiesArentMuchUsed = (uris)->
  Promise.all uris.map entityIsntMuchUsed

entityIsntMuchUsed = (uri)->
  entities_.byClaimsValue uri
  .then (claims)->
    if claims.length > 1
      throw error_.new 'this entity has too many claims to be removed', 400, uri, claims

    for claim in claims
      if claim.property in criticalClaimProperties
        throw error_.new 'this entity is used in a critical claim', 400, uri, claim
