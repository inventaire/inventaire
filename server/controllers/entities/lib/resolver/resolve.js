import resolveEdition from './resolve_edition'
import { resolveAuthorsByExternalIds, resolveWorksByExternalIds } from './resolve_by_external_ids'
import resolveInContext from './resolve_in_context'
import resolveOnTerms from './resolve_on_terms'

export default async entry => {
  await Promise.all([
    resolveEdition(entry),
    resolveAuthorsByExternalIds(entry),
    resolveWorksByExternalIds(entry),
  ])
  await resolveInContext(entry)
  await resolveOnTerms(entry)

  addResolvedFlag(entry.edition)
  if (entry.works) entry.works.forEach(addResolvedFlag)
  if (entry.authors) entry.authors.forEach(addResolvedFlag)

  return entry
}

const addResolvedFlag = seed => {
  seed.resolved = (seed.uri != null)
}
