__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
runQuery = require './run_query'

module.exports = (req, res)->
  { query:queryName, refresh } = req.query

  unless _.isNonEmptyString queryName
    return error_.bundleMissingQuery 'query'

  runQuery req.query
  .then _.Wrap(res, 'entities')
  .catch error_.Handler(req, res)
