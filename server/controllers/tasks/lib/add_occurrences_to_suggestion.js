const __ = require('config').universalPath
const getOccurrencesFromExternalSources = __.require('controllers', 'entities/lib/get_occurrences_from_external_sources')
const getOccurrencesFromEntities = __.require('controllers', 'entities/lib/get_occurrences_from_entities')

module.exports = suspectWorksData => async suggestion => {
  if (suggestion == null) return []
  const { labels, langs } = suspectWorksData
  const { uri } = suggestion

  if (labels.length === 0) {
    suggestion.occurrences = []
    return suggestion
  }

  return Promise.all([
    getOccurrencesFromExternalSources(uri, labels, langs),
    getOccurrencesFromEntities(uri, labels)
  ])
  .then(([ externalOccurrences, entitiesOccurrences ]) => {
    suggestion.occurrences = externalOccurrences.concat(entitiesOccurrences)
    return suggestion
  })
}
