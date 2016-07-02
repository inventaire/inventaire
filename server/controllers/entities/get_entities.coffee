__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'

module.exports = (req, res, next)->
  { ids } = req.query

  unless _.isNonEmptyString ids
    return error_.bundle req, res, "ids can't be empty", 401, req.query

  entities_.byIds ids.split('|')
  .then extractId
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

extractId = (entities)-> _.indexBy entities, '_id'
