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
    getAuthorWorks({ uri, dry: true }).get('works')
  ]
  .spread (occurrences, sugggestionWorks)->
    suggestion.occurrences = occurrences
    addIdenticalLabel(sugggestionWorks, labels, suggestion)

addIdenticalLabel = (sugggestionWorks, suspectWorksLabels, suggestion)->
  uris = sugggestionWorks.map _.property('uri')

  getEntitiesByUris { uris }
  .get 'entities'
  .then _.values
  .then (suggestionWorksData)->
    for sugWork in suggestionWorksData
      sugWorkLabels = _.values sugWork.labels
      matchedTitles = []
      for sugWorkLabel in sugWorkLabels
        if sugWorkLabel in suspectWorksLabels
          matchedTitles.push sugWorkLabel
    suggestion.occurrences ?= []
    if matchedTitles?
      suggestion.occurrences.push
        uri: sugWork.uri
        matchedTitles: matchedTitles
    suggestion
