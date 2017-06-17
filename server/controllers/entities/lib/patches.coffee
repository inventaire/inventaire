__ = require('config').universalPath
_ = __.require 'builders', 'utils'
db = __.require('couch', 'base')('entities', 'patches')
Patch = __.require 'models', 'patch'
Entity = __.require 'models', 'entity'
promises_ = __.require 'lib', 'promises'
{ maxKey } = __.require 'lib', 'couch'

module.exports = patches_ =
  db: db
  byId: db.get
  byUserId: (userId, limit, offset)->
    db.viewCustom 'byUserId',
      startkey: [ userId, maxKey ]
      endkey: [ userId ]
      include_docs: true
      descending: true
      limit: limit
      skip: offset

  create: (userId, currentDoc, updatedDoc)->
    promises_.try -> Patch.create userId, currentDoc, updatedDoc
    .then db.postAndReturn

  getSnapshots: (entityId)->
    byEntityId entityId
    .then (patchDocs)->
      base = Entity.create()
      return Patch.getSnapshots base, patchDocs

byEntityId = (entityId)-> db.viewByKey 'byEntityId', entityId
