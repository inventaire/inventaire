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
    Promise.all suggestions.map getOccurences authorWorksData
    .then turnSuggestionIntoRedirection(suggestions, authorWorksData)
    .then (occurences)->
      Promise.all filterSuggestions(occurences, suggestions)
      .then createTasksDocs(authorWorksData, occurences)

turnSuggestionIntoRedirection = (suggestions, authorWorksData)->
  return (occurences) ->
    unless _.some(_.flattenDeep(occurences)) then return occurences
    { labels, authorId } = authorWorksData
    # Todo : check every labels to turn entity into redirection
    unless canBeRedirected suggestions, labels[0] then return occurences
    # assume first occurence is the right one to merge into
    # only one suggestion necessary to merge
    # occurences of first suggestion picked
    turnIntoRedirection reconcilerUserId, authorId, occurences[0].uri
    []

filterSuggestions = (occurences, suggestions)->
  # create a task for every suggestions
  unless _.some(_.flattenDeep(occurences)) then return suggestions
  # create tasks only for suggestions with occurences
  suggestions.filter suggestionsWithOccurences occurences

createTasksDocs = (authorWorksData, occurences) ->
  return (suggestions) ->
    relationScore = calculateRelationScore suggestions
    return suggestions.map create authorWorksData, relationScore, occurences

canBeRedirected = (suggestions, workLabel) ->
  # several suggestions == has homonym
  unless suggestions.length == 1 then return false
  workLabel.length > 12

suggestionsWithOccurences = (occurences)->
  return (suggestions)->
    suggestionsUris = _.pluck suggestions, 'uri'
    occurencesUris = _.pluck occurences, 'uri'
    _.intersection suggestionsUris, occurencesUris

getOccurences = (authorWorksData)->
  return (suggestion)->
    { labels, langs } = authorWorksData
    hasWorksLabelsOccurrence suggestion.uri, labels, langs
    .then (occurences)->
      if _.isEmpty(_.flattenDeep(occurences)) then return []
      return
        uri: suggestion.uri
        occurences: occurences

create = (authorWorksData, relationScore, suggestionsOccurences)->
  occurrencesBySuggestionUri = _.indexBy suggestionsOccurences, 'uri'
  return (suggestion)->
    { authorId } = authorWorksData
    occurencesObj = occurrencesBySuggestionUri[suggestion.uri]
    unless _.isEmpty occurencesObj
      occurences = occurencesObj['occurences']
    return
      type: 'deduplicate'
      suspectUri: prefixifyInv(authorId)
      suggestionUri: suggestion.uri
      lexicalScore: suggestion._score
      relationScore: relationScore
      hasEncyclopediaOccurence: occurences or []
