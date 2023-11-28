import { compact, uniq } from 'lodash-es'
import getAuthorsUris from '../get_authors_uris.js'
import getWorksFromAuthorsLabels from './get_works_from_authors_uris.js'
import { getAlreadyResolvedUris, someTermsMatch, resolveSeed } from './helpers.js'

export default async (works, authors) => {
  const worksAuthorsUris = compact(works.flatMap(getAuthorsUris))
  const authorsUris = uniq(getAlreadyResolvedUris(authors).concat(worksAuthorsUris))
  if (authorsUris.length === 0) return works
  return Promise.all(works.map(resolveWork(authorsUris)))
}

const resolveWork = authorsUris => workSeed => {
  if (workSeed.uri != null) return workSeed
  return getWorksFromAuthorsLabels(authorsUris)
  .then(works => works.filter(someTermsMatch(workSeed)))
  .then(resolveSeed(workSeed, 'work'))
}
