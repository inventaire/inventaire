CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
groups_ = require './groups'

module.exports =
  request: (userId, groupId)->
    groups_.userInGroupOrOut userId, groupId
    .then (bool)->
      if bool
        throw error_.new "user is already in group", 403, userId, groupId

  cancelRequest: (userId, groupId)->
    groups_.userInRequested userId, groupId
    .then (bool)->
      unless bool
        throw error_.new "request not found", 403, userId, groupId
