// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const resolveEdition = require('./resolve_edition')
const resolveSeedsByExternalIds = require('./resolve_seeds_by_external_ids')
const resolveInContext = require('./resolve_in_context')
const resolveOnTerms = require('./resolve_on_terms')

module.exports = entry => resolveEdition(entry)
.then(resolveAuthors)
.then(resolveWorks)
.then(resolveInContext)
.then(resolveOnTerms)
.then((entry) => {
  addResolvedFlag(entry.edition)
  if (entry.works) { entry.works.forEach(addResolvedFlag) }
  if (entry.authors) { entry.authors.forEach(addResolvedFlag) }
  return entry
})

const resolveSectionSeedsByExternalIds = section => (function(entry) {
  const seeds = entry[section]
  if (!_.some(seeds)) return entry

  return resolveSeedsByExternalIds(seeds)
  .then(seeds => entry[section] = seeds)
  .then(() => entry)
})

var resolveAuthors = resolveSectionSeedsByExternalIds('authors')
var resolveWorks = resolveSectionSeedsByExternalIds('works')

var addResolvedFlag = seed => seed.resolved = (seed.uri != null)
