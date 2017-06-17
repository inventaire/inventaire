# An endpoint to get entities history as snapshots and diffs
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
entities_ = require './lib/entities'
patches_ = require './lib/patches'

module.exports = (req, res)->
  { user:userId, limit, offset } = req.query

  unless _.isUserId userId
    return error_.bundleInvalid req, res, 'user', userId

  limit or= '50'
  offset or= '0'

  unless _.isPositiveIntegerString limit
    return error_.bundleInvalid req, res, 'limit', limit

  unless _.isPositiveIntegerString offset
    return error_.bundleInvalid req, res, 'offset', offset

  limit = _.stringToInt limit
  offset = _.stringToInt offset

  if limit > 100
    return error_.bundle req, res, "limit can't be over 100", 400, limit

  patches_.byUserId userId, limit, offset
  .then _.Wrap(res, 'patches')
  .catch error_.Handler(req, res)
