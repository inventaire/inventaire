CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
resolveEdition = require './resolve_edition'
resolveWork = require './resolve_work'
resolveAuthor = require './resolve_author'

module.exports = (entry)->
  { edition, works, authors } = entry

  result = {}

  resolveEdition edition
  .then (uri)-> result.edition = uri
  .then -> resolveCollection result, 'works', works, resolveWork
  .then -> resolveCollection result, 'authors', authors, resolveAuthor
  .then -> result

resolveCollection = (result, name, entities, resolveFn)->
  Promise.all entities.map(resolveFn)
  .then (uris)-> result[name] = uris
