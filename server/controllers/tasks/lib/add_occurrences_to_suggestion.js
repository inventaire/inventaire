
const __ = require('config').universalPath
const getOccurrencesFromExternalSources = __.require('controllers', 'entities/lib/get_occurrences_from_external_sources')
const getOccurrencesFromEntities = __.require('controllers', 'entities/lib/get_occurrences_from_entities')
const { Promise } = __.require('lib', 'promises')

module.exports = suspectWorksData => suggestion => {
  if (suggestion == null) return []
  const { labels, langs } = suspectWorksData
  const { uri } = suggestion

  if (labels.length === 0) {
    suggestion.occurrences = []
    return Promise.resolve(suggestion)
  }

  return Promise.all([
    getOccurrencesFromExternalSources(uri, labels, langs),
    getOccurrencesFromEntities(uri, labels)
  ])
  .spread((externalOccurrences, entitiesOccurrences) => {
    suggestion.occurrences = externalOccurrences.concat(entitiesOccurrences)
    return suggestion
  })
}
