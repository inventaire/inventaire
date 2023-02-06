import _ from '#builders/utils'
import resolveAuthorsFromWorks from './resolve_authors_from_works.js'
import resolveEditionFromWorks from './resolve_edition_from_works.js'
import resolveWorksFromAuthors from './resolve_works_from_authors.js'
import resolveWorksFromEdition from './resolve_works_from_edition.js'

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
