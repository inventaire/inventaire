CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
resolveEdition = require './resolve_edition'
resolveWork = require './resolve_work'
resolveAuthor = require './resolve_author'
getAuthorsFromWorksUris = require './get_authors_from_works_uris'
getWorksFromAuthorsUris = require './get_works_from_authors_uris'
addUriInContext = require './add_uri_in_context'
addUriFromLabels = require './add_uri_from_labels'
{ Promise } = __.require 'lib', 'promises'

module.exports = (userId)-> (entry)->
  { edition, works, authors } = entry

  resolveCollection edition, resolveEdition
  .then -> resolveCollection works, resolveWork
  .then -> resolveCollection authors, resolveAuthor
  .then -> resolveInContext authors, works, getAuthorsFromWorksUris
  .then -> resolveInContext works, authors, getWorksFromAuthorsUris
  .then -> resolveFromLabels works, authors
  .then -> entry

resolveCollection = (entities, addResolvedUri)-> Promise.all entities.map(addResolvedUri)

resolveInContext = (entities, contextEntities, fromUris)->
  Promise.all entities.map(addUriInContext(contextEntities, fromUris))

resolveFromLabels = (works, authors)-> Promise.all authors.map(addUriFromLabels(works))
