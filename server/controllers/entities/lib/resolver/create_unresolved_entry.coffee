CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
{ createEdition, createWork, createAuthor } = require './create_entity_from_seed'

module.exports = (userId, batchId)-> (entry)->
  { edition, works, authors } = entry

  # Create authors before works, so that the created entities uris
  # can be set on the entry, and used in works claims
  createAuthors entry, userId, batchId
  # Idem for works being created before the edition
  .then -> createWorks entry, userId, batchId
  .then -> createEdition edition, works, userId, batchId
  .then -> entry

createAuthors = (entry, userId, batchId)->
  { authors } = entry
  Promise.all authors.map(createAuthor(userId, batchId))

createWorks = (entry, userId, batchId)->
  { works, authors } = entry
  Promise.all works.map(createWork(userId, batchId, authors))
