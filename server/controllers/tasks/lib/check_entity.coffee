CONFIG = require 'config'
__ = require('config').universalPath
_ = __.require 'builders', 'utils'

error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
{ searchTimeout } = CONFIG
{ host:elasticHost } = CONFIG.elasticsearch
{ buildSearcher, formatError } = __.require 'lib', 'elasticsearch'

module.exports = (entity)->
  title = _.values(entity.labels)[0]
  index = 'wikidata'
  promiseToElastic = buildSearcher
    index: index
    dbBaseName: 'humans'
    queryBodyBuilder:
      { size: 20, query: { bool: { match: { _all: title } } } }

  promises_.resolve promiseToElastic
  .then (searchResult)->
    entities = _.values(searchResult.entities)
    filterSuggestions(entity, entities)
  .then (entities)->
    tooManyHomonyms(entities)
  .catch _.ErrorRethrow("#{index} #{title} search err")

tooManyHomonyms = (entities)->
  if entities.length > 1
    return []
  else
    return entities

filterSuggestions = (suspectEntity, suggestionEntities)->
  suggestionEntities.filter (suggestionEntity)->
    suspectEntity.type == suggestionEntity.type

isSubsetOf = (suspectClaim, suggestionClaim) ->
  _.isEqual suspectClaim, _.pick(suggestionClaim, _.keys(suspectClaim))
