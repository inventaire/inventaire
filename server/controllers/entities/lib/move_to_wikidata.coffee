__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
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
