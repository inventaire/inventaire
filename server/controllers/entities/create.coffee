__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'
createEntity = require './lib/create_entity'
getEntityByUri = require './lib/get_entity_by_uri'

module.exports = (req, res) ->
  { body:entityData } = req

  unless _.isNonEmptyPlainObject entityData
    return error_.bundle req, res, 'bad query', 400

  { _id:reqUserId } = req.user
  { labels, claims } = entityData

  # Editions entities don't have labels
  labels ?= {}

  unless _.isPlainObject labels
    return error_.bundle req, res, 'labels should be an object', 400, entityData

  unless _.isPlainObject claims
    return error_.bundle req, res, 'claims should be an object', 400, entityData

  createEntity labels, claims, reqUserId
  # Re-request the entity's data to get it formatted
  .then (entity)-> getEntityByUri "inv:#{entity._id}", true
  .then res.json.bind(res)
  .then Track(req, ['entity', 'creation'])
  .catch error_.Handler(req, res)
