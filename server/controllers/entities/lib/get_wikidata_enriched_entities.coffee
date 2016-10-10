# # How to merge Wikidata and Inv entities?

# ## Problems
# - How to set priority in data?
# Properties on Wikidata should be set in Wikidata
# Other properties can be set in Inventaire

# - What happens when an entity in Inventaire is created in Wikidata?
#   => properties are suggested to Wikidata to get back to the above scheme

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
wdk = require 'wikidata-sdk'
{ getEntities } = __.require 'lib', 'wikidata/wikidata'
formatClaims = __.require 'lib', 'wikidata/format_claims'
formatTextFields = __.require 'lib', 'wikidata/format_text_fields'
getEntityType = __.require 'lib', 'wikidata/get_entity_type'
prefixify = __.require 'lib', 'wikidata/prefixify'
entities_ = require './entities'

module.exports = (ids)->
  # TODO: add caching at the single entity level
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

    # Filtering-out entities that aren't of the researched types
    # to match entites search needs, but this might become an issue
    # if search is used for things like main subject (wdt:P921) autocomplete
    { P31 } = entity.claims
    if P31
      simplifiedP31 = wdk.simplifyPropertyClaims P31
      entity.type = getEntityType simplifiedP31.map(prefixify)
    else
      # Make sure to override the type as Wikidata entities have a type
      # with another role in Wikibase
      entity.type = null

    if entity.type
      format entity, invEntities[wdId]
    else
      # Overriding the entity doc
      # mark as irrelevant for caching
      wdEntities[wdId] = { uri: "wd:#{wdId}", irrelevant: true }

  return { entities: _.values wdEntities }

format = (entity, invEntity)->
  entity.uri = "wd:#{entity.id}"
  entity.labels = formatTextFields entity.labels
  entity.descriptions = formatTextFields entity.descriptions
  entity.sitelinks = formatTextFields entity.sitelinks, false, 'title'
  entity.claims = formatClaims entity.claims
  # to run after claims were formatted

  # Testing without aliases: the only use would be for local entity search(?)
  delete entity.aliases

  if invEntity?
    # Purposedly not doing a deep merge so that it's all or nothing:
    # If a property has a value in Inventaire, it overrides Wikidata
    # But the responsability of properties available in Wikidata
    # should be let as much as possible to Wikidata
    _.extend entity.labels, invEntity.labels
    _.extend entity.claims, invEntity.claims
    # Attach inv database id to allow direct edit
    entity._id = invEntity._id

  return
