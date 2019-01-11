__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getAuthorWorks = __.require 'controllers', 'entities/lib/get_author_works'
getWorksLabelsOccurrence = __.require 'controllers', 'entities/lib/get_works_labels_occurrence'
getEntitiesByUris = __.require 'controllers', 'entities/lib/get_entities_by_uris'
{ Promise } = __.require 'lib', 'promises'

module.exports = (suspectWorksData)-> (suggestion)->
  unless suggestion? then return []
  { labels, langs } = suspectWorksData
  { uri } = suggestion

  Promise.all [
    getWorksLabelsOccurrence uri, labels, langs
    getInventaireWorkOccurence uri, labels
  ]
  .spread (externalOccurrences, inventaireOccurences)->
    suggestion.occurrences = externalOccurrences.concat inventaireOccurences
    return suggestion

getInventaireWorkOccurence = (uri, suspectWorksLabels) ->
  getAuthorWorks { uri, dry: true }
  .then getSuggestionWorks
  .then (suggestionWorksData)->
    occurences = []
    for sugWork in suggestionWorksData
      matchedTitles = getMatchingTitles suspectWorksLabels, _.values(sugWork.labels)
      if matchedTitles.length > 0
        { uri } = sugWork
        occurences.push { uri, matchedTitles }
    return occurences

getSuggestionWorks = (res)->
  uris = res.works.map _.property('uri')
  getEntitiesByUris { uris }
  .get 'entities'
  .then _.values

getMatchingTitles = (suspectWorksLabels, suggestionWorkLabels)->
  matchedTitles = []
  for sugWorkLabel in suggestionWorkLabels
    if sugWorkLabel in suspectWorksLabels
      matchedTitles.push sugWorkLabel
  return matchedTitles
