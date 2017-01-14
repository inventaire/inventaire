__ = require('config').universalPath
_ = __.require 'builders', 'utils'
db = __.require('couch', 'base')('entities', 'patches')
Patch = __.require 'models', 'patch'
Entity = __.require 'models', 'entity'
promises_ = __.require 'lib', 'promises'

module.exports = patches_ =
  db: db
  byId: db.get

  create: (userId, currentDoc, updatedDoc)->
    promises_.try -> Patch.create userId, currentDoc, updatedDoc
    .then db.postAndReturn

  getSnapshots: (entityId)->
    byEntityId entityId
    .then _.Log('patches')
    .then (patchDocs)->
      base = Entity.create()
      return Patch.getSnapshots base, patchDocs

    .then _.Log('with snapshots')

byEntityId = (entityId)-> db.viewByKey 'byEntityId', entityId
