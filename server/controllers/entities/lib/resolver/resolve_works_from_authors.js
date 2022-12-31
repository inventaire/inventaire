import _ from 'builders/utils'
import getWorksFromAuthorsLabels from './get_works_from_authors_uris'
import { getAlreadyResolvedUris, someTermsMatch, resolveSeed } from './helpers'
import getAuthorsUris from '../get_authors_uris'

export default async (works, authors) => {
  const worksAuthorsUris = _.compact(works.flatMap(getAuthorsUris))
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
