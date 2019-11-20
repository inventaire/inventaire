
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const resolveWorksFromEdition = require('./resolve_works_from_edition')
const resolveAuthorsFromWorks = require('./resolve_authors_from_works')
const resolveWorksFromAuthors = require('./resolve_works_from_authors')

// Resolve a work(or author) seed when the author(or work) seed is already resolved

module.exports = entry => {
  const { authors, works, edition } = entry

  if (!_.some(works)) return entry

  return resolveWorksFromEdition(works, edition)
  .then(works => {
    entry.works = works
    return resolveAuthorsFromWorks(authors, works)
    .then(authors => { entry.authors = authors })
    .then(() => resolveWorksFromAuthors(works, authors))
  })
  .then(works => { entry.works = works })
  .then(() => entry)
}
