CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getGroupPublicData = require './get_group_public_data'
create = require './create'
{ possibleActions } = require './lib/actions_lists'
handleAction = require './actions'
{ allUserGroups } = require './lib/groups'

module.exports =
  public:
    get: getGroupPublicData

  authentified:
    get: (req, res)->
      allUserGroups req.user._id
      .then res.json.bind(res)
      .catch error_.Handler(res)

    post: (req, res)->
      { action } = req.body
      switch action
        when 'create' then create req, res
        else error_.unknownAction res, action

    put: (req, res)->
      { action } = req.body

      # don't convert an undefined action to an empty string
      # it makes debugging confusing
      if action?
        action = _.camelCase action

      unless action in possibleActions
        return error_.unknownAction res, action

      handleAction action, req, res
