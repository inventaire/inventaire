__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'
createAndEditEntity = require './lib/create_and_edit_entity'

module.exports = (req, res) ->
  { body:entityData } = req

  unless _.isNonEmptyPlainObject entityData
    return error_.bundle req, res, 'bad query', 400

  { _id:userId } = req.user
  { labels, claims } = entityData

  unless _.isObject labels
    return error_.bundle req, res, 'labels should be an object', 400, entityData

  unless _.isObject claims
    return error_.bundle req, res, 'claims should be an object', 400, entityData

  createAndEditEntity labels, claims , userId
  .then res.json.bind(res)
  .then Track(req, ['entity', 'creation'])
  .catch error_.Handler(req, res)
