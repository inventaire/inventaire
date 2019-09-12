__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
searchEntityDuplicatesSuggestions = require './search_entity_duplicates_suggestions'
addOccurrencesToSuggestion = require './add_occurrences_to_suggestion'
getAuthorWorksData = require './get_author_works_data'
evaluateSuggestions = require './evaluate_suggestions'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler

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
    .then evaluateSuggestions(entity, suspectWorksData.labels)
    .then (results)->
      { merge, suggestions } = results
      if merge?
        mergeEntities reconcilerUserId, merge.from, merge.to
        .then ->
          _.info merge, 'entities automerged'
          return noTasks()

      else if suggestions?
        newSuggestions = filterOutExistingTasks existingTasks, suggestions
        return newSuggestions.map buildTaskObject(suspectUri)

      else
        return noTasks()

noTasks = -> []

buildTaskObject = (suspectUri)-> (suggestion)->
  type: 'deduplicate'
  suspectUri: suspectUri
  suggestionUri: suggestion.uri
  lexicalScore: suggestion._score
  externalSourcesOccurrences: suggestion.occurrences

filterOutExistingTasks = (existingTasks, suggestions)->
  existingTasksUris = _.map existingTasks, 'suggestionUri'
  return suggestions.filter (suggestion)-> suggestion.uri not in existingTasksUris
