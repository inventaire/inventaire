__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
reverseClaims = require './lib/reverse_claims'
sanitize = __.require 'lib', 'sanitize/sanitize'

sanitization =
  property: {}
  value: {}
  refresh: { optional: true }
  sort:
    generic: 'boolean'
    default: false

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then reverseClaims
  .then responses_.Wrap(res, 'uris')
  .catch error_.Handler(req, res)
