__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './entities'
promises_ = __.require 'lib', 'promises'
getEntityType = require './get_entity_type'
wdEdit = require 'wikidata-edit'
mergeEntities = require './merge_entities'
{ unprefixify } = require './prefix'
createWdEntity = require './create_wd_entity'

module.exports = (user, invEntityUri)->
  { _id: reqUserId } = user

  entityId = unprefixify invEntityUri

  entities_.byId entityId
  .then (entity)->
    { labels, claims } = entity
    createWdEntity { labels, claims, user }
  .then (createdEntity)->
    { uri: wdEntityUri } = createdEntity
    mergeEntities reqUserId, invEntityUri, wdEntityUri
    .then -> { uri: wdEntityUri }
