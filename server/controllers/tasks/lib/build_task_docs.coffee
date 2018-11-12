__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
searchEntityDuplicatesSuggestions = require './search_entity_duplicates_suggestions'
{ calculateRelationScore } = require './relation_score'
getAuthorWorksData = require './get_author_works_data'
hasWorksLabelsOccurrence = __.require 'controllers', 'entities/lib/has_works_labels_occurrence'
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'
automerge = require './automerge'

module.exports = (entity)->
  Promise.all [
    searchEntityDuplicatesSuggestions entity
    getAuthorWorksData entity._id
  ]
  .spread (suggestions, authorWorksData)->
    unless suggestions.length > 0 then return []
    Promise.all suggestions.map(getOccurrences authorWorksData)
    .then _.compact
    .then automerge(suggestions, authorWorksData)
    .then (occurrences)->
      Promise.all filterSuggestions(occurrences, suggestions)
      .then createTasksDocs(authorWorksData, occurrences)

filterSuggestions = (occurrences, suggestions)->
  # Create a task for every suggestions
  unless occurrences.length > 0 then return suggestions
  # Create tasks only for suggestions with occurrences
  occurrencesUris = _.pluck occurrences, 'uri'
  return suggestions.filter (suggestion)-> suggestion.uri in occurrencesUris

createTasksDocs = (authorWorksData, occurrences)-> (suggestions)->
  relationScore = calculateRelationScore suggestions
  return suggestions.map createTaskDoc(authorWorksData, relationScore, occurrences)

getOccurrences = (authorWorksData)-> (suggestion)->
  { labels, langs } = authorWorksData
  { uri } = suggestion
  hasWorksLabelsOccurrence uri, labels, langs
  .then (occurrences)->
    if occurrences.length is 0 then return false
    return { uri, occurrences }

createTaskDoc = (authorWorksData, relationScore, suggestionsOccurrences)->
  occurrencesBySuggestionUri = _.keyBy suggestionsOccurrences, 'uri'
  return (suggestion)->
    { authorId } = authorWorksData
    occurrencesObj = occurrencesBySuggestionUri[suggestion.uri]
    unless _.isEmpty occurrencesObj
      occurrences = occurrencesObj['occurrences']
    return {
      type: 'deduplicate'
      suspectUri: prefixifyInv authorId
      suggestionUri: suggestion.uri
      lexicalScore: suggestion._score
      relationScore: relationScore
      externalSourcesOccurrences: occurrences or []
    }
