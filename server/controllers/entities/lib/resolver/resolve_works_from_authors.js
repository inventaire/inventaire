const _ = require('builders/utils')
const getWorksFromAuthorsLabels = require('./get_works_from_authors_uris')
const { getAlreadyResolvedUris, someTermsMatch, resolveSeed } = require('./helpers')
const getAuthorsUris = require('../get_authors_uris')

module.exports = async (works, authors) => {
  const worksAuthorsUris = _.compact(works.map(getAuthorsUris).flat())
  const authorsUris = _.uniq(getAlreadyResolvedUris(authors).concat(worksAuthorsUris))
  if (authorsUris.length === 0) return works
  return Promise.all(works.map(resolveWork(authorsUris)))
}

const resolveWork = authorsUris => workSeed => {
  if (workSeed.uri != null) return workSeed
  return getWorksFromAuthorsLabels(authorsUris)
  .then(works => works.filter(someTermsMatch(workSeed)))
  .then(resolveSeed(workSeed, 'work'))
}
