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
  .spread (suggestionEntities, authorWorksData)->
    { labels, langs, authorId } = authorWorksData
    Promise.all(suggestionEntities.map(getSuggestionsWithOccurences(authorWorksData)))
    .then _.compact
    .then (suggestionsWithOccurences)->
      if suggestionEntities.length == 1 && labels[0].length > 12
        turnIntoRedirection reconcilerUserId, authorId, suggestionsWithOccurences[0].uri
        return []
      relationScore = calculateRelationScore suggestionEntities
      Promise.all suggestionEntities.map(create(authorWorksData, relationScore, suggestionsWithOccurences))

getSuggestionsWithOccurences = (authorWorksData)->
  return (suggestionEntity)->
    { labels, langs, authorId } = authorWorksData
    hasWorksLabelsOccurrence suggestionEntity.uri, labels, langs
    .then (worksLabelsOccurrence)->
      if worksLabelsOccurrence then suggestionEntity else false

create = (authorWorksData, relationScore, suggestionsWithOccurences)->
  return (suggestionEntity)->
    { authorId } = authorWorksData
    suggestionUri = suggestionEntity.uri
    _.type suggestionUri, 'string'
    return {
      type: 'deduplicate'
      suspectUri: prefixifyInv(authorId)
      suggestionUri: suggestionEntity.uri
      lexicalScore: suggestionEntity._score
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
