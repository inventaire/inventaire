const resolveEdition = require('./resolve_edition')
const { resolveAuthorsByExternalIds, resolveWorksByExternalIds } = require('./resolve_by_external_ids')
const resolveInContext = require('./resolve_in_context')
const resolveOnTerms = require('./resolve_on_terms')

module.exports = entry => {
  return resolveEdition(entry)
  .then(resolveAuthorsByExternalIds)
  .then(resolveWorksByExternalIds)
  .then(resolveInContext)
  .then(resolveOnTerms)
  .then(entry => {
    addResolvedFlag(entry.edition)
    if (entry.works) entry.works.forEach(addResolvedFlag)
    if (entry.authors) entry.authors.forEach(addResolvedFlag)
    return entry
  })
}

const addResolvedFlag = seed => {
  seed.resolved = (seed.uri != null)
}
