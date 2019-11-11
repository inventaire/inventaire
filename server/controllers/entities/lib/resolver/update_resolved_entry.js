CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require '../entities'

module.exports = (userId, batchId)-> (entry)->
  { edition, works, authors } = entry

  allResolvedSeeds = [ edition ].concat(works, authors).filter hasUri

  Promise.all allResolvedSeeds.map(updateEntityFromSeed(userId, batchId))
  .then -> entry

hasUri = (seed)-> seed.uri?

updateEntityFromSeed = (userId, batchId)-> (seed)->
  { uri, claims: seedClaims } = seed
  unless uri then return

  [ prefix, entityId ] = uri.split ':'
  # Do not try to update Wikidata for the moment
  if prefix is 'wd' then return

  getEntity prefix, entityId
  .then addMissingClaims(seedClaims, userId, batchId)

getEntity = (prefix, entityId)->
  if prefix is 'isbn'
    entities_.byIsbn entityId
  else
    entities_.byId entityId

addMissingClaims = (seedClaims, userId, batchId)-> (entity)->
  # Do not update if property already exists
  # Known cases: avoid updating authors who are actually edition translators
  newClaims = _.omit seedClaims, Object.keys(entity.claims)
  if _.isEmpty(newClaims) then return
  entities_.addClaims userId, newClaims, entity, batchId
