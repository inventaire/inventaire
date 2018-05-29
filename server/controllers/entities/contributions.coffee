# An endpoint to list entities edits made by a user
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
sanitize = __.require 'lib', 'sanitize/sanitize'
responses_ = __.require 'lib', 'responses'
entities_ = require './lib/entities'
patches_ = require './lib/patches'

sanitization =
  user: {}
  limit: { default: 50, max: 100 }
  offset: { default: 0 }

module.exports = (req, res)->
  sanitize req, sanitization
  .then (params)->
    { user:userId, limit, offset } = params
    patches_.byUserId userId, limit, offset
  .then responses_.Send(req, res)
  .catch error_.Handler(req, res)
