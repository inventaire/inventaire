// Tries to identify an author from the occurrences of their works labels
// in their Wikipedia article. It can thus only work for authors known by Wikidata

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const typeSearch = __.require('controllers', 'search/lib/type_search')
const getOccurrencesFromExternalSources = require('./get_occurrences_from_external_sources')
const promises_ = __.require('lib', 'promises')

// Returns a URI if an single author was identified
// returns undefined otherwise
module.exports = async (authorStr, worksLabels, worksLabelsLangs) => {
  return searchHumans(authorStr)
  .then(parseWdUris)
  .then(promises_.map(getAuthorOccurrenceData(worksLabels, worksLabelsLangs)))
  .then(authorsData => authorsData.filter(_.property('hasOccurrence')))
  .then(authorsData => {
    if (authorsData.length === 0) {
    } else if (authorsData.length === 1) {
      const { uri } = authorsData[0]
      _.log(uri, 'author found from work label')
      return uri
    } else {
      const context = { authorStr, authorsData, worksLabels, worksLabelsLangs }
      _.warn(context, 'found more than one matching author')
    }
  })
}

const searchHumans = authorStr => typeSearch({ search: authorStr, types: [ 'humans' ], filter: 'wd', exact: true })

const parseWdUris = hits => hits.map(hit => hit._source.uri)

const getAuthorOccurrenceData = (worksLabels, worksLabelsLangs) => wdAuthorUri => {
  return getOccurrencesFromExternalSources(wdAuthorUri, worksLabels, worksLabelsLangs)
  .then(occurrences => {
    const hasOccurrence = occurrences.length > 0
    return { uri: wdAuthorUri, hasOccurrence }
  })
}
