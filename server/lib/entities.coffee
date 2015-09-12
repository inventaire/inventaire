__ = require('config').root
_ = __.require 'builders', 'utils'
db = __.require('couch', 'base')('entities')
promises_ = __.require 'lib', 'promises'
Entity = __.require 'models', 'entity'

module.exports =
  db: db
  byId: db.get.bind(db)
  byIsbn: db.viewFindOneByKey.bind(db, 'byIsbn')
  create: (entityData, userId)->
    # using a promise to catch Entity.create errors
    promises_.start()
    .then Entity.create.bind(null, entityData, userId)
    .then _.Log('new entity')
    # using PUT as the CouchDB documentation recommands
    # to avoid POST as it can lead to dupplicates
    # http://wiki.apache.org/couchdb/HTTP_Document_API#POST
    .then @putEntity.bind(@)

  putEntity: (entityData)->
    db.putAndReturn entityData
    .catch _.ErrorRethrow('putEntity err')

  getEntity: (id)->
    db.get id
    # .then _.Log('get entity')
    .catch _.ErrorRethrow('getEntity err')

  getEntities: (ids)->
    ids = _.forceArray(ids)
    db.fetch(ids)
    .then _.Log('getEntities res')
