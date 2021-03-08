const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const resolveWorksFromEdition = require('./resolve_works_from_edition')
const resolveAuthorsFromWorks = require('./resolve_authors_from_works')
const resolveWorksFromAuthors = require('./resolve_works_from_authors')

// Resolve a work(or author) seed when the author(or work) seed is already resolved

module.exports = async entry => {
  const { authors, works, edition } = entry

  if (!_.some(works)) return entry

  await resolveWorksFromEdition(works, edition)
  await resolveAuthorsFromWorks(authors, works)
  await resolveWorksFromAuthors(works, authors)
  return entry
}
