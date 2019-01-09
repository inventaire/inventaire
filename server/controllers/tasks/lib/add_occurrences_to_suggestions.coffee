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
    getWorksLabelsOccurrence(uri, labels, langs)
    getInventaireWorkOccurence(uri, labels)
  ]
  .spread (externalOccurrences, inventaireOccurences)->
    if externalOccurrences || inventaireOccurences
      suggestion.occurrences = []
      suggestion.occurrences.push externalOccurrences...
      suggestion.occurrences.push inventaireOccurences...
    suggestion

getInventaireWorkOccurence = (uri, suspectWorksLabels) ->
  getAuthorWorks { uri, dry: true }
  .then (res)->
    uris = res.works.map _.property 'uri'
    getEntitiesByUris { uris }
    .get 'entities'
    .then _.values
    .then (suggestionWorksData)->
      matchedTitles = []
      for sugWork in suggestionWorksData
        sugWorkLabels = _.values sugWork.labels
        for sugWorkLabel in sugWorkLabels
          if sugWorkLabel in suspectWorksLabels
            matchedTitles.push sugWorkLabel
      if matchedTitles.length > 0
        occurence = []
        occurence.push
          uri: sugWork.uri
          matchedTitles: matchedTitles
        occurence




