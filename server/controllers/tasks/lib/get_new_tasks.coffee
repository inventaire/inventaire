__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
searchEntityDuplicatesSuggestions = require './search_entity_duplicates_suggestions'
addOccurrencesToSuggestion = require './add_occurrences_to_suggestion'
getAuthorWorksData = require './get_author_works_data'
automerge = require './automerge'

module.exports = (entity)-> (existingTasks)->
  { uri:suspectUri } = entity
  Promise.all [
    searchEntityDuplicatesSuggestions entity, existingTasks
    getAuthorWorksData entity._id
  ]
  .spread (newSuggestions, suspectWorksData)->
    unless newSuggestions.length > 0 then return []
    suspectWorksLabels = suspectWorksData.labels
    Promise.all newSuggestions.map(addOccurrencesToSuggestion(suspectWorksData))
    .then automerge(entity, suspectWorksData.labels)
    .then filterOutTasks(existingTasks)
    .then buildTaskObject(suspectUri)

buildTaskObject = (suspectUri)-> (suggestions)->
  return suggestions.map (suggestion)->
    type: 'deduplicate'
    suspectUri: suspectUri
    suggestionUri: suggestion.uri
    lexicalScore: suggestion._score
    externalSourcesOccurrences: suggestion.occurrences

filterOutTasks = (existingTasks)-> (suggestions)->
  existingTasksUris = _.map existingTasks, 'suggestionUri'
  return suggestions.filter (suggestion)-> suggestion.uri not in existingTasksUris
