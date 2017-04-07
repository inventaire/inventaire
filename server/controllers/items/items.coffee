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
      'last-public': require './last_public'
      'by-user-and-entity': require './by_user_and_entity'
    authentified:
      'nearby': require './nearby'

  post: require './create'
  put: require './update'

  delete: (req, res, next) ->
    { id } = req.query
    reqUserId = req.user._id

    items_.verifyOwnership id, reqUserId
    .then items_.delete.bind(null, id)
    .then res.json.bind(res)
    .catch error_.Handler(req, res)

require('./lib/update_snapshot_on_entity_change')()
