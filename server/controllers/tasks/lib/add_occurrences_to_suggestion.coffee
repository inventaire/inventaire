__ = require('config').universalPath
_ = __.require 'builders', 'utils'
getOccurrencesFromExternalSources = __.require 'controllers', 'entities/lib/get_occurrences_from_external_sources'
getOccurrencesFromEntities = __.require 'controllers', 'entities/lib/get_occurrences_from_entities'
{ Promise } = __.require 'lib', 'promises'

module.exports = (suspectWorksData)-> (suggestion)->
  unless suggestion? then return []
  { labels, langs } = suspectWorksData
  { uri } = suggestion

  # Filter-out labels that are too short, as it could generate false positives
  labels = labels.filter (label)-> label.length > 5

  if labels.length is 0
    suggestion.occurrences = []
    return Promise.resolve suggestion

  Promise.all [
    getOccurrencesFromExternalSources uri, labels, langs
    getOccurrencesFromEntities uri, labels
  ]
  .spread (externalOccurrences, entitiesOccurrences)->
    suggestion.occurrences = externalOccurrences.concat entitiesOccurrences
    return suggestion
