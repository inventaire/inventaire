# # How to merge Wikidata and Inv entities?

# ## Problems
# - How to set priority in data?
# Properties on Wikidata should be set in Wikidata
# Other properties can be set in Inventaire

# - What happens when an entity in Inventaire is created in Wikidata?
#   => properties are suggested to Wikidata to get back to the above scheme

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ getEntities, formatTextFields, formatClaims } = __.require 'lib', 'wikidata'
wdk = require 'wikidata-sdk'
{ Promise } = __.require 'lib', 'promises'
entities_ = require './entities'
indexById = require './index_by_id'

module.exports = (ids)->
  # TODO: add caching
  Promise.all [
    getEntities(ids).get 'entities'
    getInvEntitiesByWikidataIds ids
  ]
  .spread mergeWdAndInvData

getInvEntitiesByWikidataIds = (ids)->
  entities_.byWikidataIds ids
  .then (entities)->
    index = {}
    for entity in entities
      wdId = entity.claims['invp:P1'][0]
      index[wdId] = entity
    return index

mergeWdAndInvData = (wdEntities, invEntities)->
  for wdId, entity of wdEntities

    entity.labels = formatTextFields entity.labels
    entity.descriptions = formatTextFields entity.descriptions
    entity.aliases = formatTextFields entity.aliases, true
    entity.claims = formatClaims entity.claims

    invEntity = invEntities[wdId]
    if invEntity?
      # Purposedly not doing a deep merge so that it's all or nothing:
      # If a property has a value in Inventaire, it overrides Wikidata
      # But the responsability of properties available in Wikidata
      # should be let as much as possible to Wikidata
      _.extend entity.labels, invEntity.labels
      _.extend entity.claims, invEntity.claims

  return { entities: wdEntities }
