CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
resolveEdition = require './resolve_edition'
resolveWork = require './resolve_work'
resolveAuthor = require './resolve_author'
resolveInContext = require './resolve_in_context'
addUriFromLabels = require './add_uri_from_labels'
{ Promise } = __.require 'lib', 'promises'

module.exports = (userId)-> (entry)->
  { edition, works, authors } = entry

  resolveEdition edition
  .then -> resolveCollection works, resolveWork
  .then -> resolveCollection authors, resolveAuthor
  .then -> resolveInContext works, authors
  .then -> resolveFromLabels works, authors
  .then -> entry

resolveCollection = (entities, addResolvedUri)-> Promise.all entities.map(addResolvedUri)

resolveFromLabels = (works, authors)-> Promise.all authors.map(addUriFromLabels(works))
