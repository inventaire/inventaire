__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
transactions_ = require './lib/transactions'
request = require './request'
messages = require './messages'

module.exports =
  get: (req, res, next)->
    { action } = req.query

    switch action
      when 'get-messages' then messages.get(req, res, next)
      else error_.bundle res, 'unknown action', 400

  post: (req, res, next)->
    { action } = req.body

    switch action
      when 'request' then request(req, res, next)
      when 'new-message' then messages.post(req, res, next)
      else error_.bundle res, 'unknown action', 400
