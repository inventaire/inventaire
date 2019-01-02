__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
searchEntityDuplicatesSuggestions = require './search_entity_duplicates_suggestions'
getAuthorWorksData = require './get_author_works_data'
getWorksLabelsOccurrence = __.require 'controllers', 'entities/lib/get_works_labels_occurrence'
automerge = require './automerge'

module.exports = (entity)-> (existingTasks)->
  { uri: suspectUri } = entity
  Promise.all [
    searchEntityDuplicatesSuggestions entity, existingTasks
    getAuthorWorksData entity._id
  ]
  .spread (newSuggestions, authorWorksData)->
    unless newSuggestions.length > 0 then return []
    Promise.all newSuggestions.map(addOccurrences(authorWorksData))
    .then automerge(suspectUri)
    .then buildTaskObject(suspectUri)

addOccurrences = (authorWorksData)-> (suggestion)->
  { labels, langs } = authorWorksData
  { uri } = suggestion
  getWorksLabelsOccurrence uri, labels, langs
  .then (occurrences)->
    suggestion.occurrences = occurrences
    return suggestion

buildTaskObject = (suspectUri)-> (suggestions)->
  return suggestions.map (suggestion)->
    type: 'deduplicate'
    suspectUri: suspectUri
    suggestionUri: suggestion.uri
    lexicalScore: suggestion._score
    externalSourcesOccurrences: suggestion.occurrences
