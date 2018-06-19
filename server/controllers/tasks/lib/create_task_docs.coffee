__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'

entities_ = __.require 'controllers', 'entities/lib/entities'
checkEntity = require './check_entity'
{ calculateRelationScore } = require './relation_score'
hasWorksLabelsOccurrence = __.require 'controllers', 'entities/lib/has_works_labels_occurrence'

module.exports = (entity)->
  Promise.all [
    checkEntity entity
    getAuthorWorksData entity._id
  ]
  .spread (suggestionEntities, authorWorksData)->
    relationScore = calculateRelationScore suggestionEntities
    create = createTaskDocs authorWorksData, relationScore
    Promise.all suggestionEntities.map(create)

createTaskDocs = (authorWorksData, relationScore)->
  { labels, langs } = authorWorksData
  return (suggestionEntity)->
    suggestionUri = suggestionEntity.uri
    hasWorksLabelsOccurrence suggestionUri, labels, langs
    .then (hasOccurence)->
      unless suggestionEntity.uri? then return {}
      return {
        type: 'deduplicate'
        suspectUri: prefixify authorWorksData.authorId
        suggestionUri: suggestionEntity.uri
        lexicalScore: suggestionEntity._score
        relationScore: relationScore
        hasEncyclopediaOccurence: hasOccurence
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

prefixify = (id)-> "inv:#{id}"
