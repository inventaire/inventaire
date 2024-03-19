import { getAuthorsFromWorksUris } from './get_authors_from_works_uris.js'
import { getAlreadyResolvedUris, someTermsMatch, resolveSeed } from './helpers.js'

export default async (authors, works) => {
  const worksUris = getAlreadyResolvedUris(works)
  if (worksUris.length === 0) return authors
  return Promise.all(authors.map(resolveAuthor(worksUris)))
}

const resolveAuthor = worksUris => authorSeed => {
  if (authorSeed.uri != null) return authorSeed
  return getAuthorsFromWorksUris(worksUris)
  .then(authors => authors.filter(someTermsMatch(authorSeed)))
  .then(resolveSeed(authorSeed, 'human'))
}
