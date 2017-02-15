__ = require('config').universalPath
ActionsControllers = __.require 'lib', 'actions_controllers'
{ fetchUsersNearby, fetchItemsNearby } = require './get_by_position'

module.exports =
  publicActions: ActionsControllers
    'get-users': require './get_users_public_data'
    'search': require './search_by_username'
    'search-by-position': require './search_by_position'

  actions: ActionsControllers
    'get-users-nearby': fetchUsersNearby
    # TODO: move to items controller
    'get-items-nearby': fetchItemsNearby
