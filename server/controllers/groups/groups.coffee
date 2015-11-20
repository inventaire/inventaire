CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getGroupPublicData = require './get_group_public_data'
create = require './create'
{ possibleActions } = require './lib/actions_lists'
{ handleAction } = require './actions'

module.exports =
  get: getGroupPublicData
  post: (req, res, next)->
    { action } = req.body
    switch action
      when 'create' then create req, res
      else error_.unknownAction res, action

  put: (req, res, next)->
    { action } = req.body
    action = _.camelCase action

    unless action in possibleActions
      return error_.unknownAction res, action

    handleAction action, req, res
