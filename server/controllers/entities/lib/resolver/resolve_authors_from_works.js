// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const getAuthorsFromWorksUris = require('./get_authors_from_works_uris')
const { getAlreadyResolvedUris, someTermsMatch, resolveSeed } = require('./helpers')
const { getEntityNormalizedTerms } = require('../terms_normalization')

module.exports = function(authors, works){
  const worksUris = getAlreadyResolvedUris(works)
  if (worksUris.length === 0) { return Promise.resolve(authors) }
  return Promise.all(authors.map(resolveAuthor(worksUris)))
}

var resolveAuthor = worksUris => (function(author) {
  if (author.uri != null) { return author }
  const authorSeedTerms = getEntityNormalizedTerms(author)
  return getAuthorsFromWorksUris(worksUris)
  .filter(someTermsMatch(authorSeedTerms))
  .then(resolveSeed(author))
})
