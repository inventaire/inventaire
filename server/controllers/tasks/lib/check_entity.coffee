__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

searchWikidataByText = __.require 'data', 'wikidata/search_by_text'

Task = __.require 'models', 'task'

module.exports = (entity)->
  title = _.values(entity.labels)[0]

  searchWikidataByText
    search: title
  .then (searchResult)->
    entities = _.values(searchResult.entities)
    filterSuggestions entity, entities
  .then (entities)->
    tooManyHomonyms(entities)
  .then (suggestionEntities)->
    newTasks = createTasks entity, suggestionEntities
    return { "tasks": newTasks }

tooManyHomonyms = (entities)->
  if entities.length > 2
    return []
  else
    return entities

filterSuggestions = (suspectEntity, suggestionEntities)->
    suggestionEntities.filter (suggestionEntity)->
      sameType(suspectEntity, suggestionEntity) &&
      isSubsetOf(suspectEntity.claims, suggestionEntity.claims)

createTasks = (suspectEntity, suggestionEntities)->
  suggestionEntities.map (suggestion)->
    suspectUri = urify suspectEntity
    suggestionUri = suggestion.uri
    Task.create suspectUri, suggestionUri

urify = (entity)->
  "inv:#{entity._id}"

sameType = (entity, otherEntity)->
  entity.type == otherEntity.type

isSubsetOf = (suspectClaim, suggestionClaim) ->
  _.isEqual suspectClaim, _.pick(suggestionClaim, _.keys(suspectClaim))
