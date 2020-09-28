// Tries to identify an author from the occurrences of their works labels
// in their Wikipedia article. It can thus only work for authors known by Wikidata

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const typeSearch = __.require('controllers', 'search/lib/type_search')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')
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

const searchHumans = typeSearch.bind(null, { types: [ 'humans' ] })

const parseWdUris = res => {
  return res.hits.hits
  .filter(hit => (hit._index === 'wikidata') && (hit._score > 1))
  .map(hit => prefixifyWd(hit._id))
}

const getAuthorOccurrenceData = (worksLabels, worksLabelsLangs) => wdAuthorUri => {
  return getOccurrencesFromExternalSources(wdAuthorUri, worksLabels, worksLabelsLangs)
  .then(occurrences => {
    const hasOccurrence = occurrences.length > 0
    return { uri: wdAuthorUri, hasOccurrence }
  })
}
