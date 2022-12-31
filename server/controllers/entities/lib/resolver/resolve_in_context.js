import _ from 'builders/utils'
import resolveWorksFromEdition from './resolve_works_from_edition'
import resolveAuthorsFromWorks from './resolve_authors_from_works'
import resolveWorksFromAuthors from './resolve_works_from_authors'
import resolveEditionFromWorks from './resolve_edition_from_works'

// Resolve a work(or author) seed when the author(or work) seed is already resolved

export default async entry => {
  const { authors, works, edition } = entry

  if (!_.some(works)) return entry

  await resolveWorksFromEdition(works, edition)
  await resolveAuthorsFromWorks(authors, works)
  await resolveWorksFromAuthors(works, authors)
  await resolveEditionFromWorks(edition, works)
  return entry
}
