__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
responses_ = __.require 'lib', 'responses'
transactions_ = require './lib/transactions'
sanitize = __.require 'lib', 'sanitize/sanitize'

sanitization = {}

module.exports = (req, res)->
  sanitize req, res, sanitization
  .get 'reqUserId'
  .then transactions_.byUser
  .then responses_.Wrap(res, 'transactions')
  .catch error_.Handler(req, res)
