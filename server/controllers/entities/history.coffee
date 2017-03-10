# An endpoint to get entities history as snapshots and diffs
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
entities_ = require './lib/entities'
patches_ = require './lib/patches'

module.exports = (req, res)->
  { id } = req.query

  unless _.isInvEntityId id
    return error_.bundleInvalid req, res, 'id', id

  patches_.getSnapshots id
  .then _.Wrap(res, 'patches')
  .catch error_.Handler(req, res)
