__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

searchWikidataByText = __.require 'data', 'wikidata/search_by_text'

module.exports = (entity)->
  title = _.values(entity.labels)[0]

  searchWikidataByText
    search: title
  .then (searchResult)->
    entities = _.values(searchResult.entities)
    filterSuggestions(entity, entities)
  .then (entities)->
    tooManyHomonyms(entities)

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
