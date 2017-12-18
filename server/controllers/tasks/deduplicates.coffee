__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tasks_ = require './lib/tasks'

module.exports = (req, res)->
  { limit } = req.query
  limit or= '10'

  try
    limit = _.stringToInt limit
  catch err
    return error_.bundleInvalid req, res, 'invalid limit', limit

  tasks_.deduplicates limit
  .then res.json.bind(res)
  .catch error_.Handler(req, res)
