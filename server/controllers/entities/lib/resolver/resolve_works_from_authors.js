
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
const getWorksFromAuthorsLabels = require('./get_works_from_authors_uris')
const { getAlreadyResolvedUris, someTermsMatch, resolveSeed } = require('./helpers')
const { getEntityNormalizedTerms } = require('../terms_normalization')
const getAuthorsUris = require('../get_authors_uris')

module.exports = (works, authors) => {
  const worksAuthorsUris = _.compact(_.flatten(works.map(getAuthorsUris)))
  const authorsUris = _.uniq(getAlreadyResolvedUris(authors).concat(worksAuthorsUris))
  if (authorsUris.length === 0) return Promise.resolve(works)
  return Promise.all(works.map(resolveWork(authorsUris)))
}

const resolveWork = authorsUris => work => {
  if (work.uri != null) return work
  const workSeedTerms = getEntityNormalizedTerms(work)
  return Promise.all(getWorksFromAuthorsLabels(authorsUris))
  .filter(someTermsMatch(workSeedTerms))
  .then(resolveSeed(work))
}
