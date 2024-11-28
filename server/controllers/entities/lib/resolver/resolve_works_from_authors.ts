import { compact, uniq } from 'lodash-es'
import type { EntitySeed } from '#types/resolver'
import { getAuthorsUris } from '../get_authors_uris.js'
import { getWorksFromAuthorsUris } from './get_works_from_authors_uris.js'
import { getAlreadyResolvedUris, someTermsMatch, resolveSeed } from './helpers.js'

export async function resolveWorksFromAuthors (works: EntitySeed[], authors: EntitySeed[]) {
  const worksAuthorsUris = compact(works.flatMap(getAuthorsUris))
  const authorsUris = uniq(getAlreadyResolvedUris(authors).concat(worksAuthorsUris))
  if (authorsUris.length === 0) return works
  return Promise.all(works.map(resolveWork(authorsUris)))
}

const resolveWork = authorsUris => workSeed => {
  if (workSeed.uri != null) return workSeed
  return getWorksFromAuthorsUris(authorsUris)
  .then(works => works.filter(someTermsMatch(workSeed)))
  .then(resolveSeed(workSeed, 'work'))
}
