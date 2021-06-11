const resolveEdition = require('./resolve_edition')
const { resolveAuthorsByExternalIds, resolveWorksByExternalIds } = require('./resolve_by_external_ids')
const resolveInContext = require('./resolve_in_context')
const resolveOnTerms = require('./resolve_on_terms')

module.exports = async entry => {
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
