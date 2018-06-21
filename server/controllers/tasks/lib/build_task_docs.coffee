__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'

entities_ = __.require 'controllers', 'entities/lib/entities'
searchEntityDuplicatesSuggestions = require './search_entity_duplicates_suggestions'
{ calculateRelationScore } = require './relation_score'
hasWorksLabelsOccurrence = __.require 'controllers', 'entities/lib/has_works_labels_occurrence'
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'

module.exports = (entity)->
  Promise.all [
    searchEntityDuplicatesSuggestions entity
    getAuthorWorksData entity._id
  ]
  .spread (suggestionEntities, authorWorksData)->
    relationScore = calculateRelationScore suggestionEntities
    Promise.all suggestionEntities.map(create(authorWorksData, relationScore))

create = (authorWorksData, relationScore)->
  { labels, langs } = authorWorksData
  return (suggestionEntity)->
    suggestionUri = suggestionEntity.uri
    _.type suggestionUri, 'string'
    hasWorksLabelsOccurrence suggestionUri, labels, langs
    .then (hasOccurence)->
      type: 'deduplicate'
      suspectUri: prefixifyInv authorWorksData.authorId
      suggestionUri: suggestionEntity.uri
      lexicalScore: suggestionEntity._score
      relationScore: relationScore
      hasEncyclopediaOccurence: hasOccurence

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
