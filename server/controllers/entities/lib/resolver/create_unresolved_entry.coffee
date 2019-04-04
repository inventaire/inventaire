CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
{ createEdition, createWork, createAuthor } = require './create_seed'

module.exports = (userId, batchId)-> (entry)->
  { edition, works, authors } = entry

  createAuthors entry, userId, batchId
  .then -> createWorks entry, userId, batchId
  .then -> createEdition edition, works, userId, batchId
  .then -> entry

createAuthors = (entry, userId, batchId)->
  { authors } = entry
  Promise.all authors.map(createAuthor(userId, batchId))

createWorks = (entry, userId, batchId)->
  { works, authors } = entry
  Promise.all works.map(createWork(userId, batchId, authors))
