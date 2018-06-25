__ = require('config').universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
tasks_ = require './lib/tasks'
sanitize = __.require 'lib', 'sanitize/sanitize'

sanitization =
  limit:
    default: 10
  offset:
    default: 0

module.exports = (req, res)->
  sanitize req, res, sanitization
  .then tasks_.byScore
  .then responses_.Wrap(res, 'tasks')
  .catch error_.Handler(req, res)
