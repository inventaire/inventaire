CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
resolveEdition = require './resolve_edition'
resolveSeedsByExternalIds = require './resolve_seeds_by_external_ids'
resolveInContext = require './resolve_in_context'
resolveOnLabels = require './resolve_on_labels'

module.exports = (entry)->
  resolveEdition entry
  .then resolveAuthors
  .then resolveWorks
  .then resolveInContext
  .then resolveOnLabels
  .then (entry)->
    addResolvedFlag(entry.edition)
    if entry.works then entry.works.forEach(addResolvedFlag)
    if entry.authors then entry.authors.forEach(addResolvedFlag)
    return entry

resolveAuthors = (entry)->
  { authors } = entry
  unless _.some(authors) then return entry

  resolveSeedsByExternalIds authors
  .then (authors)-> entry.authors = authors
  .then -> entry

resolveWorks = (entry)->
  { works } = entry
  unless _.some(works) then return entry

  resolveSeedsByExternalIds works
  .then (works)-> entry.works = works
  .then -> entry

addResolvedFlag = (seed)-> seed.resolved = seed.uri?
