__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'

entities_ = __.require 'controllers', 'entities/lib/entities'
checkEntity = require './check_entity'
{ calculateRelationScore } = require './relation_score'
hasWorksLabelsOccurrence = __.require 'controllers', 'entities/lib/has_works_labels_occurrence'

module.exports = (entity)->
  unless entity? then return newTasks

  Promise.all [
    checkEntity entity
    getAuthorWorksData entity._id
  ]
  .spread (suggestionEntities, authorWorksData)->
    relationScore = calculateRelationScore suggestionEntities
    Promise.all suggestionEntities.map(createTaskDocs(authorWorksData, relationScore))

createTaskDocs = (authorWorksData, relationScore)-> (suggestionEntity)->
  hasWorksLabelsOccurrence(suggestionEntity.uri, authorWorksData.labels, authorWorksData.langs)
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
    # works = [ { labels: { fr: 'Matiere et Memoire'} }, { labels: { en: 'foo' } } ]
    worksData = works.reduce aggregateWorksData, { authorId: authorId, labels: [], langs: [] }
    worksData.langs = _.uniq worksData.langs
    return worksData

aggregateWorksData = (worksData, work)->
  for lang, label of work.labels
    worksData.labels.push label
    worksData.langs.push lang
  return worksData

prefixify = (id)-> "inv:#{id}"
