const _ = require('builders/utils')
const resolveEdition = require('./resolve_edition')
const resolveSeedsByExternalIds = require('./resolve_seeds_by_external_ids')
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
    if (entry.works) { entry.works.forEach(addResolvedFlag) }
    if (entry.authors) { entry.authors.forEach(addResolvedFlag) }
    return entry
  })
}

const resolveSectionSeedsByExternalIds = section => entry => {
  const seeds = entry[section]
  if (!_.some(seeds)) return entry

  return resolveSeedsByExternalIds(seeds)
  .then(seeds => { entry[section] = seeds })
  .then(() => entry)
}

const resolveAuthorsByExternalIds = resolveSectionSeedsByExternalIds('authors')
const resolveWorksByExternalIds = resolveSectionSeedsByExternalIds('works')

const addResolvedFlag = seed => {
  seed.resolved = (seed.uri != null)
}
