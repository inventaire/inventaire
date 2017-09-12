__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
getEntitiesByUris = require './get_entities_by_uris'
entities_ = require './entities'
items_ = __.require 'controllers', 'items/lib/items'

criticalClaimProperties = [
  # No edition should end up without an associated work because of a removed work
  'wdt:P629'
]

blacklistedClaimProperties = [
  # Editions with an ISBN shouldn't be removed, but fixed
  'wdt:P212'
]

module.exports = (uris)->
  Promise.all [
    entitiesChecks uris
    entitiesRelationsChecks uris
    entitiesItemsChecks uris
  ]

entitiesChecks = (uris)->
  getEntitiesByUris uris
  .then (res)->
    for uri, entity of res.entities
      # Verify that entities don't have blacklisted claims
      if _.haveAMatch Object.keys(entity.claims), blacklistedClaimProperties
        throw error_.new "this entity uses blacklisted claim properties", 400, uri

entitiesRelationsChecks = (uris)-> Promise.all uris.map entityIsntMuchUsed

entityIsntMuchUsed = (uri)->
  entities_.byClaimsValue uri
  .then (claims)->
    if claims.length > 1
      throw error_.new 'this entity has too many claims to be removed', 400, uri, claims

    for claim in claims
      if claim.property in criticalClaimProperties
        throw error_.new 'this entity is used in a critical claim', 400, uri, claim

entitiesItemsChecks = (uris)-> Promise.all uris.map entityIsntUsedByAnyItem
entityIsntUsedByAnyItem = (uri)->
  items_.byEntity uri
  .then (items)->
    if items.length > 0
      throw error_.new "entities that are used by an item can't be removed", 400, uri
