import { getAuthorsFromWorksUris } from '#controllers/entities/lib/entities'
import { getAlreadyResolvedUris, someTermsMatch, resolveSeed } from './helpers.js'

export default async function (authors, works) {
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
