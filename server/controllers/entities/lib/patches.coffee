__ = require('config').universalPath
_ = __.require 'builders', 'utils'
db = __.require('couch', 'base')('entities', 'patches')
Patch = __.require 'models', 'patch'
promises_ = __.require 'lib', 'promises'

module.exports =
  db: db
  byId: db.get.bind(db)
  create: (userId, currentDoc, updatedDoc)->
    promises_.try -> Patch.create userId, currentDoc, updatedDoc
    .then db.postAndReturn
