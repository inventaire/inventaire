__ = require('config').universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
error_ = __.require 'lib', 'error/error'

ActionsControllers = __.require 'lib', 'actions_controllers'

module.exports =
  get: ActionsControllers
    public:
      'by-ids': require './by_ids'
      'by-users': require './by_users'
      'by-entities': require './by_entities'
      'recent-public': require './recent_public'
      'by-user-and-entity': require './by_user_and_entity'
    authentified:
      'nearby': require './nearby'
      'inventory-view': require './inventory_view'

  post: ActionsControllers
    authentified:
      default: require './create'
    admin:
      'refresh-snapshot': require './refresh_snapshot'

  put: require './update'

  delete: (req, res, next)->
    { id } = req.query
    reqUserId = req.user._id

    items_.verifyOwnership id, reqUserId
    .then items_.delete.bind(null, id)
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

require('./lib/snapshot/update_snapshot_on_entity_change')()
