const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const getWorksFromAuthorsLabels = require('./get_works_from_authors_uris')
const { getAlreadyResolvedUris, someTermsMatch, resolveSeed } = require('./helpers')
const { getEntityNormalizedTerms } = require('../terms_normalization')
const getAuthorsUris = require('../get_authors_uris')

module.exports = async (works, authors) => {
  const worksAuthorsUris = _.compact(_.flatten(works.map(getAuthorsUris)))
  const authorsUris = _.uniq(getAlreadyResolvedUris(authors).concat(worksAuthorsUris))
  if (authorsUris.length === 0) return works
  return Promise.all(works.map(resolveWork(authorsUris)))
}

const resolveWork = authorsUris => work => {
  if (work.uri != null) return work
  const workSeedTerms = getEntityNormalizedTerms(work)
  return Promise.all(getWorksFromAuthorsLabels(authorsUris))
  .then(works => works.filter(someTermsMatch(workSeedTerms)))
  .then(resolveSeed(work))
}
