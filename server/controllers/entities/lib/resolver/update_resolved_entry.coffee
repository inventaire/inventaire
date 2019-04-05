CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require '../entities'

module.exports = (userId, batchId)-> (entry)->
  { edition, works, authors } = entry

  updateAuthors authors, userId, batchId
  .then -> updateWorks works, userId, batchId
  .then -> updateEntityFromSeed(userId, batchId)(edition)
  .then -> entry

updateAuthors = (authors, userId, batchId)->
  resolvedAuthors = _.filter authors, 'uri'
  Promise.all resolvedAuthors.map updateEntityFromSeed(userId, batchId)

updateWorks = (works, userId, batchId)->
  resolvedWorks = _.filter works, 'uri'
  Promise.all resolvedWorks.map updateEntityFromSeed(userId, batchId)

updateEntityFromSeed = (userId, batchId)-> (seed)->
  { uri, claims:seedClaims } = seed
  unless uri then return

  getEntity uri
  .then updateClaims(seedClaims, userId, batchId)

getEntity = (uri)->
  [ prefix, entityId ] = uri.split ':'
  # Skip wikidata entities for the moment
  if prefix is 'wd' then return
  if prefix is 'isbn'
    entities_.byIsbn entityId
  else
    entities_.byId entityId

updateClaims = (seedClaims, userId, batchId)-> (entity)->
  entityProps = Object.keys entity.claims
  newClaims = {}

  _.mapKeys seedClaims, (seedValues, seedProp)->
    # do not update if property already exists
    # known cases: avoid updating authors who are actually edition translators
    unless seedProp in entityProps
      newClaims[seedProp] = seedValues

  if _.isEmpty(newClaims) then return

  entities_.addClaims userId, newClaims, entity, batchId
