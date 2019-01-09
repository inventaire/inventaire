__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Promise } = __.require 'lib', 'promises'
entities_ = require './entities'
items_ = __.require 'controllers', 'items/lib/items'
getEntitiesByUris = require './get_entities_by_uris'

criticalClaimProperties = [
  # No edition should end up without an associated work because of a removed work
  'wdt:P629'
]

module.exports = (uris)->
  Promise.all [
    entitiesRelationsChecks uris
    entitiesItemsChecks uris
  ]

entitiesRelationsChecks = (uris)-> Promise.all uris.map(entityIsntUsedMuch)

entityIsntUsedMuch = (uri)->
  entities_.byClaimsValue uri
  .then (claims)->
    # Tolerating 1 claim: typically when a junk author entity is linked via a wdt:P50 claim
    # to a work, the author can be deleted, which will also remove the claim on the work
    if claims.length > 1
      throw error_.new 'this entity has too many claims to be removed', 400, uri, claims

    for claim in claims
      if claim.property in criticalClaimProperties
        throw error_.new 'this entity is used in a critical claim', 400, uri, claim

entitiesItemsChecks = (uris)->
  getAllUris uris
  .map entityIsntUsedByAnyItem

getAllUris = (uris)->
  getEntitiesByUris { uris }
  .then (res)->
    unless res.redirects? then return uris
    missingCanonicalUris = _.values res.redirects
    return uris.concat missingCanonicalUris

entityIsntUsedByAnyItem = (uri)->
  items_.byEntity uri
  .then (items)->
    if items.length > 0
      throw error_.new "entities that are used by an item can't be removed", 400, uri
