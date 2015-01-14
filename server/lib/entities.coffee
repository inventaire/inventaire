__ = require('config').root
_ = __.require 'builders', 'utils'

uuid = require 'simple-uuid'

module.exports =
  db: __.require 'couch', 'entities'
  create: (entityData)->
    entityData = @normalizeData(entityData)
    # using PUT as the CouchDB documentation recommands
    # to avoid POST as it can lead to dupplicates
    # http://wiki.apache.org/couchdb/HTTP_Document_API#POST
    return @putEntity(entityData)

  normalizeData: (entityData)->
    unless entityData.title? then throw new Error 'entity miss a title'
    entityData._id = uuid()
    return entityData

  putEntity: (entityData)->
    @db.put entityData
    .then @getEntity.bind(@, entityData._id)
    .catch (err)-> _.log err, 'putEntity err'

  getEntity: (id)->
    @db.get id
    .then (res)-> _.log res, 'new entity'
    .catch (err)-> _.log err, 'getEntity err'
