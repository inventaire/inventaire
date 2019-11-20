
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
// Tries to identify an author from the occurrences of their works labels
// in their Wikipedia article. It can thus only work for authors known by Wikidata

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const typeSearch = __.require('controllers', 'search/lib/type_search')
const { prefixifyWd } = __.require('controllers', 'entities/lib/prefix')
const getOccurrencesFromExternalSources = require('./get_occurrences_from_external_sources')

// Returns a URI if an single author was identified
// returns undefined otherwise
module.exports = (authorStr, worksLabels, worksLabelsLangs) => searchHumans(authorStr)
.then(getWdAuthorUris)
.map(getAuthorOccurrenceData(worksLabels, worksLabelsLangs))
.filter(_.property('hasOccurrence'))
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

const searchHumans = typeSearch.bind(null, [ 'humans' ])

const getWdAuthorUris = res => res.hits.hits
.filter(hit => (hit._index === 'wikidata') && (hit._score > 1))
.map(hit => prefixifyWd(hit._id))

const getAuthorOccurrenceData = (worksLabels, worksLabelsLangs) => wdAuthorUri => getOccurrencesFromExternalSources(wdAuthorUri, worksLabels, worksLabelsLangs)
.then(occurrences => {
  const hasOccurrence = occurrences.length > 0
  return { uri: wdAuthorUri, hasOccurrence }
})
