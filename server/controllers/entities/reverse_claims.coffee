__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
reverseClaims = require './lib/reverse_claims'

module.exports = (req, res, next)->
  { property, uri, refresh } = req.query

  unless _.isPropertyUri property
    return error_.bundle req, res, 'invalid property', 400

  unless _.isEntityUri uri
    return error_.bundle req, res, 'invalid uri', 400

  reverseClaims property, uri, refresh
  .then _.Wrap(res, 'uris')
  .catch error_.Handler(req, res)
