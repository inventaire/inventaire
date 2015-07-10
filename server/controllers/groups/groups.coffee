CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getGroupPublicData = require './get_group_public_data'
create = require './create'
invite = require './invite'
{ accept, decline } = require './answer_invitation'

module.exports =
  get: getGroupPublicData
  post: (req, res, next)->
    { action } = req.body
    switch action
      when 'create' then create req, res
      else error_.unknownAction res

  put: (req, res, next)->
    { action } = req.body
    switch action
      when 'invite' then invite req, res
      when 'accept' then accept req, res
      when 'decline' then decline req, res
      else error_.unknownAction res
