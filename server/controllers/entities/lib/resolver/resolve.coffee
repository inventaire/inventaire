CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
resolveEdition = require './resolve_edition'
resolveSeedsByExternalIds = require './resolve_seeds_by_external_ids'
resolveInContext = require './resolve_in_context'
resolveOnLabels = require './resolve_on_labels'
{ Promise } = __.require 'lib', 'promises'

module.exports = (entry)->
  resolveEdition entry
  .then resolveAuthors
  .then resolveWorks
  .then resolveInContext
  .then resolveOnLabels

resolveAuthors = (entry)->
  { authors } = entry
  unless _.some(authors) then return entry

  Promise.all resolveSeedsByExternalIds(authors)
  .then (authors)-> entry.authors = authors
  .then -> entry

resolveWorks = (entry)->
  { works } = entry
  unless _.some(works) then return entry

  Promise.all resolveSeedsByExternalIds(works)
  .then (works)-> entry.works = works
  .then -> entry

