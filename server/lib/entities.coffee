__ = require('config').root
_ = __.require 'builders', 'utils'

uuid = require 'simple-uuid'

db = __.require('couch', 'base')('entities')

module.exports =
  db: db
  byId: db.get.bind(db)
  byIsbn: db.viewFindOneByKey.bind(db, 'byIsbn')
  create: (entityData)->
    entityData = @normalizeData entityData
    # using PUT as the CouchDB documentation recommands
    # to avoid POST as it can lead to dupplicates
    # http://wiki.apache.org/couchdb/HTTP_Document_API#POST
    return @putEntity entityData

  normalizeData: (entityData)->
    unless entityData.title? then throw new Error 'entity miss a title'
    entityData._id = uuid()
    return entityData

  putEntity: (entityData)->
    db.put entityData
    .then @getEntity.bind(@, entityData._id)
    .catch _.ErrorRethrow('putEntity err')

  getEntity: (id)->
    db.get id
    .then _.Log('new entity')
    .catch _.ErrorRethrow('getEntity err')

  getEntities: (ids)->
    ids = _.forceArray(ids)
    db.fetch(ids)
    .then _.Log('getEntities res')
