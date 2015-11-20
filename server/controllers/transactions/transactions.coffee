__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
transactions_ = require './lib/transactions'
request = require './request'
updateState = require './update_state'
messages = require './messages'
markAsRead = require './mark_as_read'

module.exports =
  get: (req, res, next)->
    { action } = req.query

    switch action
      when 'get-messages' then messages.get req, res
      else error_.unknownAction res

  post: (req, res, next)->
    { action } = req.body

    switch action
      when 'request' then request req, res
      when 'new-message' then messages.post req, res
      else error_.unknownAction res

  put: (req, res, next)->
    { action } = req.body

    switch action
      when 'update-state' then updateState req, res
      when 'mark-as-read' then markAsRead req, res
      else error_.unknownAction res
