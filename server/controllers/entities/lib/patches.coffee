__ = require('config').universalPath
_ = __.require 'builders', 'utils'
designDocName = 'patches'
db = __.require('couch', 'base')('patches', designDocName)
Patch = __.require 'models', 'patch'
Entity = __.require 'models', 'entity'
promises_ = __.require 'lib', 'promises'
{ maxKey } = __.require 'lib', 'couch'

module.exports = patches_ =
  db: db
  byId: db.get
  byEntityIds: (entityIds)-> db.viewByKeys 'byEntityId', entityIds
  byUserId: (userId, limit, offset)->
    db.view designDocName, 'byUserId',
      startkey: [ userId, maxKey ]
      endkey: [ userId ]
      include_docs: true
      descending: true
      limit: limit
      skip: offset
    .then (res)->
      data =
        patches: _.pluck res.rows, 'doc'
        total: res.total_rows
      continu = limit + offset
      if continu < data.total then data.continue = continu
      return data

  create: (userId, currentDoc, updatedDoc)->
    promises_.try -> Patch.create userId, currentDoc, updatedDoc
    .then db.postAndReturn

  getSnapshots: (entityId)->
    byEntityId entityId
    .then (patchDocs)->
      base = Entity.create()
      return Patch.getSnapshots base, patchDocs

byEntityId = (entityId)-> db.viewByKey 'byEntityId', entityId
