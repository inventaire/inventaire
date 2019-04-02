__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
validateEntity = require './validate_entity'
{ unprefixify } = require './prefix'
{ prefixifyInv, unprefixify } = require './prefix'

module.exports = (params)->
  { labels, claims, userId, batchId } = params
  _.log params, 'inv entity creation'

  validateEntity { labels, claims }
  .then -> entities_.create()
  .then (currentDoc)->
    entities_.edit {
      userId,
      currentDoc,
      updatedLabels: labels,
      updatedClaims: claims,
      batchId
    }
  .then (entity)->
    entity.uri = prefixifyInv entity._id
    return entity
