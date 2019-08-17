__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
validateEntity = require './validate_entity'
{ unprefixify } = require './prefix'
{ prefixifyInv, unprefixify } = require './prefix'

module.exports = (params)->
  { labels, claims, userId } = params
  _.log params, 'inv entity creation'

  validateEntity { labels, claims }
  .then -> entities_.create()
  .then entities_.edit.bind(null, userId, labels, claims)
  .then (entity)->
    entity.uri = prefixifyInv entity._id
    return entity
