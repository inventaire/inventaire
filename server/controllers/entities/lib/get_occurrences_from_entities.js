// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const getAuthorWorks = __.require('controllers', 'entities/lib/get_author_works')
const getEntitiesList = __.require('controllers', 'entities/lib/get_entities_list')
const { getEntityNormalizedTerms } = require('./terms_normalization')

module.exports = (uri, suspectWorksLabels) => getAuthorWorks({ uri })
.then(getSuggestionWorks)
.then(suggestionWorksData => {
  const occurrences = []
  for (const sugWork of suggestionWorksData) {
    const sugWorkTerms = getEntityNormalizedTerms(sugWork)
    const matchedTitles = _.intersection(suspectWorksLabels, sugWorkTerms)
    if (matchedTitles.length > 0) {
      ({ uri } = sugWork)
      occurrences.push({ uri, matchedTitles, structuredDataSource: true })
    }
  }
  return occurrences
})

const getSuggestionWorks = res => {
  const uris = res.works.map(_.property('uri'))
  return getEntitiesList(uris)
}
