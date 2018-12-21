__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
searchEntityDuplicatesSuggestions = require './search_entity_duplicates_suggestions'
{ calculateRelationScore } = require './relation_score'
getAuthorWorksData = require './get_author_works_data'
getWorksLabelsOccurrence = __.require 'controllers', 'entities/lib/get_works_labels_occurrence'
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'
automerge = require './automerge'

module.exports = (entity, existingTasks)->
  { uri: suspectUri } = entity
  Promise.all [
    searchEntityDuplicatesSuggestions entity
    getAuthorWorksData entity._id
  ]
  .spread (suggestions, authorWorksData)->
    suggestions = filterOutExistingTasksSuggestions suggestions, existingTasks
    unless suggestions.length > 0 then return []
    Promise.all suggestions.map(addOccurrences(authorWorksData))
    .then automerge(suspectUri)
    # build tasks from remaining suggestions, if any
    .then buildTasksDocs(suspectUri)

addOccurrences = (authorWorksData)-> (suggestion)->
  { labels, langs } = authorWorksData
  { uri } = suggestion
  getWorksLabelsOccurrence uri, labels, langs
  .then (occurrences)->
    _.log occurrences, 'occurrences'
    suggestion.occurrences = occurrences
    return suggestion

buildTasksDocs = (suspectUri)-> (suggestions)->
  relationScore = calculateRelationScore suggestions
  return suggestions.map createTaskDoc(suspectUri, relationScore)

createTaskDoc = (suspectUri, relationScore)-> (suggestion)->
  type: 'deduplicate'
  suspectUri: suspectUri
  suggestionUri: suggestion.uri
  lexicalScore: suggestion._score
  relationScore: relationScore
  externalSourcesOccurrences: suggestion.occurrences

filterOutExistingTasksSuggestions = (suggestions, existingTasks)->
  existingTasksUris = _.map existingTasks, 'suggestionUri'
  return suggestions.filter (suggestion)-> suggestion.uri not in existingTasksUris
