# An endpoint to get statistics on users data contributions
# Reserved to admins for the moment, as some data might be considered privacy issue
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
patches_ = require './lib/patches'

module.exports = (req, res)->
  { period } = req.query

  if period?
    unless _.isPositiveIntegerString period
      return error_.bundleInvalid req, res, 'period', period

    period = _.stringToInt period

    patches_.getActivityFromLastDay period
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

  else

    promise = patches_.getGlobalActivity()
    .then _.Wrap(res, 'activity')
    .catch error_.Handler(req, res)
