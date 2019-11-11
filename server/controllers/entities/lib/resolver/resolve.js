CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
resolveEdition = require './resolve_edition'
resolveSeedsByExternalIds = require './resolve_seeds_by_external_ids'
resolveInContext = require './resolve_in_context'
resolveOnTerms = require './resolve_on_terms'

module.exports = (entry)->
  resolveEdition entry
  .then resolveAuthors
  .then resolveWorks
  .then resolveInContext
  .then resolveOnTerms
  .then (entry)->
    addResolvedFlag(entry.edition)
    if entry.works then entry.works.forEach(addResolvedFlag)
    if entry.authors then entry.authors.forEach(addResolvedFlag)
    return entry

resolveSectionSeedsByExternalIds = (section)-> (entry)->
  seeds = entry[section]
  unless _.some(seeds) then return entry

  resolveSeedsByExternalIds seeds
  .then (seeds)-> entry[section] = seeds
  .then -> entry

resolveAuthors = resolveSectionSeedsByExternalIds 'authors'
resolveWorks = resolveSectionSeedsByExternalIds 'works'

addResolvedFlag = (seed)-> seed.resolved = seed.uri?
