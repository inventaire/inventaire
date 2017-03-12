__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
entities_ = require './lib/entities'
defaultLimit = 100

module.exports = (req, res)->
  { since } = req.query

  if since?
    if _.isPositiveIntegerString(since) then since = _.stringToInt since
    else return error_.bundleInvalid req, res, 'since', since

  entities_.getLastChangedEntitiesUris since, defaultLimit
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
