import { some } from 'lodash-es'
import type { SanitizedResolverEntry } from '#types/resolver'
import { resolveAuthorsFromWorks } from './resolve_authors_from_works.js'
import { resolveEditionFromWorks } from './resolve_edition_from_works.js'
import { resolveWorksFromAuthors } from './resolve_works_from_authors.js'
import { resolveWorksFromEdition } from './resolve_works_from_edition.js'

// Resolve a work(or author) seed when the author(or work) seed is already resolved

export async function resolveInContext (entry: SanitizedResolverEntry) {
  const { authors, works, edition } = entry

  if (!some(works)) return entry

  await resolveWorksFromEdition(works, edition)
  await resolveAuthorsFromWorks(authors, works)
  await resolveWorksFromAuthors(works, authors)
  await resolveEditionFromWorks(edition, works)
  return entry
}
