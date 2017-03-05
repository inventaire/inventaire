CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
publicActions = require './public_actions'
{ possibleActions } = require './lib/actions_lists'
handleAction = require './actions'
{ allUserGroups } = require './lib/groups'
ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    public:
      'by-id': publicActions.byId
      'search': publicActions.searchByName
      'search-by-position': publicActions.searchByPositon
      'last': publicActions.lastGroups
    authentified:
      'default': (req, res)->
        allUserGroups req.user._id
        .then res.json.bind(res)
        .catch error_.Handler(req, res)

  post: ActionsControllers
    authentified:
      'create': require './create'

  put: (req, res)->
    unless req.user? then return error_.unauthorizedApiAccess req, res
    { action } = req.body

    # don't convert an undefined action to an empty string
    # it makes debugging confusing
    if action?
      action = _.camelCase action

    unless action in possibleActions
      return error_.unknownAction req, res, action

    handleAction action, req, res
