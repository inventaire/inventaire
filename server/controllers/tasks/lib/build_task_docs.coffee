__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'

searchEntityDuplicatesSuggestions = require './search_entity_duplicates_suggestions'
{ calculateRelationScore } = require './relation_score'
getAuthorWorksData = require './get_author_works_data'
hasWorksLabelsOccurrence = __.require 'controllers', 'entities/lib/has_works_labels_occurrence'
{ turnIntoRedirection } = __.require 'controllers', 'entities/lib/merge_entities'
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'
{ _id:reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler

module.exports = (entity)->
  Promise.all [
    searchEntityDuplicatesSuggestions entity
    getAuthorWorksData entity._id
  ]
  .spread (suggestions, authorWorksData)->
    unless suggestions.length > 0 then return []
    Promise.all suggestions.map getOccurrences authorWorksData
    .then _.compact
    .then turnSuggestionIntoRedirection(suggestions, authorWorksData)
    .then (occurrences)->
      Promise.all filterSuggestions(occurrences, suggestions)
      .then createTasksDocs(authorWorksData, occurrences)

turnSuggestionIntoRedirection = (suggestions, authorWorksData)->
  return (occurrences) ->
    unless occurrences.length > 0 then return occurrences
    { labels, authorId } = authorWorksData
    matchedTitles = getMatchedTitles(occurrences)
    # Todo : check every labels to turn entity into redirection
    unless canBeRedirected suggestions, matchedTitles then return occurrences
    # assume first occurrence is the right one to merge into
    # since only one suggestion necessary to merge
    # occurrences of first suggestion picked
    turnIntoRedirection reconcilerUserId, authorId, occurrences[0].uri
    return []

getMatchedTitles = (occurrences)->
    matchedTitles = occurrences.map (occ)-> _.pluck(occ.occurrences,'matchedTitles')
    _.flattenDeep matchedTitles

filterSuggestions = (occurrences, suggestions)->
  # create a task for every suggestions
  unless occurrences.length > 0 then return suggestions
  # create tasks only for suggestions with occurrences
  suggestions.filter (suggestion)->
    occurrencesUris = _.pluck occurrences, 'uri'
    suggestion.uri in occurrencesUris

createTasksDocs = (authorWorksData, occurrences) ->
  return (suggestions) ->
    relationScore = calculateRelationScore suggestions
    return suggestions.map create(authorWorksData, relationScore, occurrences)

canBeRedirected = (suggestions, matchedTitles) ->
  # several suggestions == has homonym => cannot be redirected
  unless suggestions.length == 1 then return false
  longTitles = matchedTitles.filter (title) -> title.length > 12
  longTitles.length > 0


getOccurrences = (authorWorksData)->
  return (suggestion)->
    { labels, langs } = authorWorksData
    hasWorksLabelsOccurrence suggestion.uri, labels, langs
    .then (occurrences)->
      if occurrences.length is 0 then return false
      return
        uri: suggestion.uri
        occurrences: occurrences

create = (authorWorksData, relationScore, suggestionsOccurrences)->
  occurrencesBySuggestionUri = _.indexBy suggestionsOccurrences, 'uri'
  return (suggestion)->
    { authorId } = authorWorksData
    occurrencesObj = occurrencesBySuggestionUri[suggestion.uri]
    unless _.isEmpty occurrencesObj
      occurrences = occurrencesObj['occurrences']
    return
      type: 'deduplicate'
      suspectUri: prefixifyInv(authorId)
      suggestionUri: suggestion.uri
      lexicalScore: suggestion._score
      relationScore: relationScore
      externalSourcesOccurrences: occurrences or []
