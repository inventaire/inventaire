__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
reverseClaims = require './lib/reverse_claims'

module.exports = (req, res, next)->
  { property, uri, refresh } = req.query

  unless _.isPropertyUri property
    return error_.bundleInvalid req, res, 'property', property

  unless _.isEntityUri uri
    return error_.bundleInvalid req, res, 'uri', uri

  refresh = _.parseBooleanString refresh

  reverseClaims property, uri, refresh
  .then _.Wrap(res, 'uris')
  .catch error_.Handler(req, res)
