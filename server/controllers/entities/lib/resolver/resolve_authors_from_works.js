const getAuthorsFromWorksUris = require('./get_authors_from_works_uris')
const { getAlreadyResolvedUris, someTermsMatch, resolveSeed } = require('./helpers')
const { getEntityNormalizedTerms } = require('../terms_normalization')

module.exports = async (authors, works) => {
  const worksUris = getAlreadyResolvedUris(works)
  if (worksUris.length === 0) return authors
  return Promise.all(authors.map(resolveAuthor(worksUris)))
}

const resolveAuthor = worksUris => authorSeed => {
  if (authorSeed.uri != null) return authorSeed
  const authorSeedTerms = getEntityNormalizedTerms(authorSeed)
  return getAuthorsFromWorksUris(worksUris)
  .then(authors => authors.filter(someTermsMatch(authorSeedTerms)))
  .then(resolveSeed(authorSeed, 'human'))
}
