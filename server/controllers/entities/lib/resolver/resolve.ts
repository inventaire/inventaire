import type { SanitizedResolverEntry } from '#types/resolver'
import { resolveAuthorsByExternalIds, resolveWorksByExternalIds } from './resolve_by_external_ids.js'
import { resolveEdition } from './resolve_edition.js'
import resolveInContext from './resolve_in_context.js'
import resolveOnTerms from './resolve_on_terms.js'

export async function resolveEntry (entry: SanitizedResolverEntry) {
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

function addResolvedFlag (seed) {
  seed.resolved = (seed.uri != null)
}
