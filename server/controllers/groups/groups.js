CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
responses_ = __.require 'lib', 'responses'
error_ = __.require 'lib', 'error/error'
publicActions = require './public_actions'
{ allUserGroups } = require './lib/groups'
ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    public:
      'by-id': publicActions.byId
      'by-slug': publicActions.bySlug
      'search': publicActions.searchByText
      'search-by-position': publicActions.searchByPositon
      'last': publicActions.lastGroups
      'slug': publicActions.slug
    authentified:
      'default': (req, res)->
        allUserGroups req.user._id
        .then responses_.Wrap(res, 'groups')
        .catch error_.Handler(req, res)

  post: ActionsControllers
    authentified:
      'create': require './create'

  put: require './update'
