const getAuthorsFromWorksUris = require('./get_authors_from_works_uris')
const { getAlreadyResolvedUris, someTermsMatch, resolveSeed } = require('./helpers')
const { getEntityNormalizedTerms } = require('../terms_normalization')

module.exports = async (authors, works) => {
  const worksUris = getAlreadyResolvedUris(works)
  if (worksUris.length === 0) return authors
  return Promise.all(authors.map(resolveAuthor(worksUris)))
}

const resolveAuthor = worksUris => author => {
  if (author.uri != null) return author
  const authorSeedTerms = getEntityNormalizedTerms(author)
  return getAuthorsFromWorksUris(worksUris)
  .filter(someTermsMatch(authorSeedTerms))
  .then(resolveSeed(author))
}
