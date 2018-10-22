__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'

entities_ = __.require 'controllers', 'entities/lib/entities'
searchEntityDuplicatesSuggestions = require './search_entity_duplicates_suggestions'
{ calculateRelationScore } = require './relation_score'
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
    Promise.all(suggestions.map(getOccurences(authorWorksData)))
    .then _.compact
    .then (occurences)->
      unless _.some occurences
        # create a task for every suggestions
        relationScore = calculateRelationScore suggestions
        return Promise.all suggestions.map(create(authorWorksData, relationScore, occurences))
      createOrRedirectSuggestions(occurences, suggestions, authorWorksData)

createOrRedirectSuggestions = (occurences, suggestions, authorWorksData)->
    { labels, authorId } = authorWorksData
    unless canBeRedirected suggestions, labels[0]
      # create a task for suggestions with occurences
      relationScore = calculateRelationScore occurences
      return suggestions.filter(suggestedEntities(occurences))
      .map(create(authorWorksData, relationScore, occurences))

    turnIntoRedirection reconcilerUserId, authorId, occurences[0].uri
    []

canBeRedirected = (suggestions, workLabel) ->
  unless suggestions.length == 1
    return false # several sugestions == has homonym
  workLabel.length > 12

suggestedEntities = (occurencesResult)->
  return (suggestions)->
    suggestionsUris = _.pluck suggestions, 'uri'
    occurencesResultUris = _.pluck occurencesResult, 'uri'
    _.intersection suggestionsUris, occurencesResultUris

getOccurences = (authorWorksData)->
  return (suggestion)->
    { labels, langs } = authorWorksData
    hasWorksLabelsOccurrence suggestion.uri, labels, langs
    .then (worksLabelsOccurrence)->
      if worksLabelsOccurrence then suggestion else false

create = (authorWorksData, relationScore, suggestionsWithOccurences)->
  return (suggestion)->
    { authorId } = authorWorksData
    suggestionUri = suggestion.uri
    _.type suggestionUri, 'string'
    return {
      type: 'deduplicate'
      suspectUri: prefixifyInv(authorId)
      suggestionUri: suggestion.uri
      lexicalScore: suggestion._score
      relationScore: relationScore
      hasEncyclopediaOccurence: _.some(suggestionsWithOccurences)
    }

getAuthorWorksData = (authorId)->
  entities_.byClaim 'wdt:P50', "inv:#{authorId}", true, true
  .then (works)->
    # works = [
    #   { labels: { fr: 'Matiere et Memoire'} },
    #   { labels: { en: 'foo' } }
    # ]
    base = { authorId, labels: [], langs: [] }
    worksData = works.reduce aggregateWorksData, base
    worksData.langs = _.uniq worksData.langs
    return worksData

aggregateWorksData = (worksData, work)->
  for lang, label of work.labels
    worksData.labels.push label
    worksData.langs.push lang
  return worksData
