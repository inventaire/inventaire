CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
resolveEdition = require './resolve_edition'
resolveWork = require './resolve_work'
resolveAuthor = require './resolve_author'
resolveInContext = require './resolve_in_context'

module.exports = (entry)->
  { edition, works, authors } = entry

  resolveEdition edition
  .then -> resolveCollection works, resolveWork
  .then -> resolveCollection authors, resolveAuthor
  .then -> resolveInContext entry
  .then -> entry

resolveCollection = (entities, addResolvedUri)-> Promise.all entities.map(addResolvedUri)
