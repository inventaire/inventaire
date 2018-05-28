__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
tasks_ = require './lib/tasks'

module.exports = (req, res)->
  { limit, offset } = req.query

  limit or= '10'
  offset or= '0'

  unless _.isPositiveIntegerString limit
    return error_.bundleInvalid req, res, 'limit', limit

  unless _.isPositiveIntegerString offset
    return error_.bundleInvalid req, res, 'offset', offset

  limit = _.stringToInt limit
  offset = _.stringToInt offset

  tasks_.byScore { limit, offset }
  .then _.Wrap(res, 'tasks')
  .catch error_.Handler(req, res)
